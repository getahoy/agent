import type { Logger, RequestResult } from "@getahoy/lib";
import type { EndReason } from "@getahoy/protocol";
import type { PairedPhone } from "../../core/pairing/pairedPhone.ts";
import type { IdentityStore } from "../identity/identityStore.ts";
import { listPairingLinks, unlinkPairing } from "./pairingApi.ts";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;

type LinkMonitorOptions = {
  apiUrl: string;
  identity: IdentityStore;
  logger: Logger;
  onPeerEnded: (
    phone: PairedPhone,
    reason: EndReason,
    whileAsleep: boolean,
  ) => void;
};

export type CheckReason = "wake" | "routine";

function settled(result: RequestResult<unknown>): boolean {
  if (result.code === "success") return true;
  const { error } = result;
  return error.kind === "api" && error.detail.code === "not_found";
}

export class LinkMonitor {
  readonly #options: LinkMonitorOptions;
  #timer: ReturnType<typeof setInterval> | null = null;

  constructor(options: LinkMonitorOptions) {
    this.#options = options;
  }

  start(): void {
    void this.check("routine");
    this.#timer = setInterval(
      () => void this.check("routine"),
      CHECK_INTERVAL_MS,
    );
  }

  stop(): void {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = null;
  }

  async check(reason: CheckReason): Promise<void> {
    const { apiUrl, identity, onPeerEnded } = this.#options;
    const sessionToken = identity.sessionToken();
    if (!sessionToken) return;
    await this.flushUnlinks();
    const device = identity.encodedPublicKey();
    const listed = await listPairingLinks({
      apiUrl,
      sessionToken,
      body: { device },
    });
    if (listed.code === "error") return;
    for (const phone of identity.pairedPhones()) {
      const link = listed.data.links.find(
        (candidate) => candidate.peerPublicKey === phone.publicKey,
      );
      if (!link || link.active) continue;
      onPeerEnded(phone, link.reason ?? "removed", reason === "wake");
    }
  }

  async flushUnlinks(): Promise<void> {
    const { apiUrl, identity, logger } = this.#options;
    const sessionToken = identity.sessionToken();
    if (!sessionToken) return;
    const devicePublicKey = identity.encodedPublicKey();
    for (const unlink of identity.pendingUnlinks()) {
      const body = { devicePublicKey, ...unlink };
      const result = await unlinkPairing({ apiUrl, sessionToken, body });
      if (settled(result)) await identity.settleUnlink(unlink.peerPublicKey);
      else logger.warn("pairing", "Unlink queued, server not reachable");
    }
  }
}
