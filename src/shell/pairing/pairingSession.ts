import { setTimeout as sleep } from "node:timers/promises";
import { randomSecret } from "@getahoy/crypto";
import type { Logger } from "@getahoy/lib";
import type { DeviceDescription } from "@getahoy/protocol";
import type { PairedPhone } from "../../core/pairing/pairedPhone.ts";
import {
  type PairingFailure,
  type PairingStatus,
  pairingFailure,
} from "../../core/pairing/pairingStatus.ts";
import { pairingQr, verifiedPhone } from "../../core/pairing/pairingTerms.ts";
import type { IdentityStore } from "../identity/identityStore.ts";
import type { LanEndpoint } from "../lan/lanAddresses.ts";
import {
  type DeviceAuthClient,
  type IssuedCode,
  pollDeviceToken,
  requestDeviceCode,
} from "./deviceFlow.ts";
import { completePairing } from "./pairingApi.ts";

const SLOW_DOWN_STEP_MS = 2000;
const MS_PER_SECOND = 1000;

type RoundEnd = "expired" | "finished";

type OpenCode = { code: IssuedCode; pairingSecret: Uint8Array };

type PairingSessionOptions = {
  apiUrl: string;
  authClient: DeviceAuthClient;
  identity: IdentityStore;
  device: () => DeviceDescription;
  lanEndpoint: () => LanEndpoint | null;
  lanListening: () => boolean;
  logger: Logger;
  onStatus: (status: PairingStatus) => void;
  onReplaced: (phones: readonly PairedPhone[]) => void;
};

export class PairingSession {
  readonly #options: PairingSessionOptions;
  #run: AbortController | null = null;
  #status: PairingStatus = { kind: "idle" };

  constructor(options: PairingSessionOptions) {
    this.#options = options;
  }

  start(): void {
    if (this.#run) return;
    const run = new AbortController();
    this.#run = run;
    void this.#rounds(run.signal).finally(() => {
      if (this.#run === run) this.#run = null;
    });
  }

  stop(): void {
    this.#run?.abort();
    this.#run = null;
    const { kind } = this.#status;
    if (kind === "starting" || kind === "offering") {
      this.#emit({ kind: "idle" });
    }
  }

  async #rounds(signal: AbortSignal): Promise<void> {
    while (!signal.aborted && (await this.#round(signal)) === "expired") {
      this.#options.logger.info("pairing", "Code expired, showing a new one");
    }
  }

  async #round(signal: AbortSignal): Promise<RoundEnd> {
    const { authClient, identity, device, lanEndpoint, lanListening } =
      this.#options;
    this.#emit({ kind: "starting" });
    const requested = await requestDeviceCode(authClient);
    if (signal.aborted) return "finished";
    if (requested.kind === "failed") return this.#fail(requested.failure);
    const open = { code: requested.code, pairingSecret: randomSecret() };
    const lan = lanEndpoint() ?? undefined;
    const qr = pairingQr({
      userCode: open.code.userCode,
      displayName: device().displayName,
      desktopPublicKey: identity.encodedPublicKey(),
      pairingSecret: open.pairingSecret,
      expiresAt: open.code.expiresAt,
      lan,
    });
    const reachableOnLan = lan !== undefined && lanListening();
    const { expiresAt } = open.code;
    this.#emit({ kind: "offering", qr, expiresAt, reachableOnLan });
    return this.#awaitApproval(open, signal);
  }

  async #awaitApproval(open: OpenCode, signal: AbortSignal): Promise<RoundEnd> {
    const { authClient } = this.#options;
    const { deviceCode, expiresAt } = open.code;
    let intervalMs = open.code.intervalMs;
    while (!signal.aborted) {
      await sleep(intervalMs, undefined, { signal }).catch(() => undefined);
      if (signal.aborted) return "finished";
      if (Date.now() / MS_PER_SECOND >= expiresAt) return "expired";
      const polled = await pollDeviceToken(authClient, deviceCode);
      if (signal.aborted) return "finished";
      if (polled.kind === "approved") {
        return this.#complete(open, polled.sessionToken);
      }
      if (polled.kind === "expired") return "expired";
      if (polled.kind === "failed") return this.#fail("server");
      if (polled.kind === "slowDown") intervalMs += SLOW_DOWN_STEP_MS;
    }
    return "finished";
  }

  async #complete(open: OpenCode, sessionToken: string): Promise<RoundEnd> {
    const { apiUrl, identity, device, logger } = this.#options;
    const desktop = device();
    const completed = await completePairing({
      apiUrl,
      sessionToken,
      body: { userCode: open.code.userCode, device: desktop },
    });
    if (completed.code === "error") {
      return this.#fail(pairingFailure(completed.error));
    }
    const phone = verifiedPhone({
      complete: completed.data,
      desktopPublicKey: desktop.publicKey,
      pairingSecret: open.pairingSecret,
      now: Date.now(),
    });
    if (!phone) {
      logger.warn("pairing", "Claim proof did not match, pairing refused");
      return this.#fail("proofRejected");
    }
    const { desktopId } = completed.data;
    const replaced = await identity.completePairing({
      desktopId,
      sessionToken,
      phone,
    });
    this.#options.onReplaced(replaced);
    logger.info("pairing", "Phone paired");
    const { displayName: phoneName, accountEmail } = phone;
    this.#emit({ kind: "paired", phoneName, accountEmail });
    return "finished";
  }

  #fail(reason: PairingFailure): RoundEnd {
    this.#emit({ kind: "failed", reason });
    return "finished";
  }

  #emit(status: PairingStatus): void {
    this.#status = status;
    this.#options.onStatus(status);
  }
}
