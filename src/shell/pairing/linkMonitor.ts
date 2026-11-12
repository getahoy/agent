import {
  type ApiClient,
  doneOrGone,
  type Logger,
  pairingCalls,
} from "@getahoy/lib";
import type { EndReason } from "@getahoy/protocol";
import { app } from "electron";
import type { PairedPhone } from "../../core/pairing/pairedPhone.ts";
import type { IdentityStore } from "../identity/identityStore.ts";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;

type LinkMonitorOptions = {
  api: ApiClient;
  identity: IdentityStore;
  logger: Logger;
  onPeerEnded: (
    phone: PairedPhone,
    reason: EndReason,
    whileAsleep: boolean,
  ) => void;
};

export type CheckReason = "start" | "interval" | "wake" | "window" | "popover";

export class LinkMonitor {
  readonly #options: LinkMonitorOptions;
  readonly #calls: ReturnType<typeof pairingCalls>;
  #timer: ReturnType<typeof setInterval> | null = null;

  constructor(options: LinkMonitorOptions) {
    this.#options = options;
    this.#calls = pairingCalls(options.api.call);
  }

  start(): void {
    void this.check("start");
    this.#timer = setInterval(
      () => void this.check("interval"),
      CHECK_INTERVAL_MS,
    );
  }

  stop(): void {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = null;
  }

  async check(reason: CheckReason): Promise<void> {
    const { identity, logger, onPeerEnded } = this.#options;
    if (!identity.sessionToken()) return;
    await this.flushUnlinks();
    const listed = await this.#calls.links(identity.encodedPublicKey());
    const phones = identity.pairedPhones();
    const trace = (message: string) => {
      if (!app.isPackaged) logger.info("links", message);
    };
    trace(`check (${reason}): ${listed.code}, ${phones.length} phones`);
    if (listed.code === "error") return;
    for (const phone of phones) {
      const link = listed.data.links.find(
        (candidate) => candidate.peerPublicKey === phone.publicKey,
      );
      if (!link || link.active) continue;
      trace(`link ended on the server (${link.reason})`);
      onPeerEnded(phone, link.reason ?? "removed", reason === "wake");
    }
  }

  async flushUnlinks(): Promise<void> {
    const { identity, logger } = this.#options;
    if (!identity.sessionToken()) return;
    const devicePublicKey = identity.encodedPublicKey();
    for (const unlink of identity.pendingUnlinks()) {
      const result = await this.#calls.unlink({ devicePublicKey, ...unlink });
      if (doneOrGone(result)) await identity.settleUnlink(unlink.peerPublicKey);
      else logger.warn("pairing", "Unlink queued, server not reachable");
    }
  }
}
