import { setTimeout as sleep } from "node:timers/promises";
import { randomSecret } from "@getahoy/crypto";
import type { Logger } from "@getahoy/lib";
import type { DeviceDescription, LanEndpoint } from "@getahoy/protocol";
import { keepsCurrentCode } from "../../core/pairing/endedByPhone.ts";
import type { PairedPhone } from "../../core/pairing/pairedPhone.ts";
import {
  type CodeEffect,
  type CodeEvent,
  type CodeState,
  codeStep,
  finishesWhenPaused,
  idleCode,
} from "../../core/pairing/pairingCode.ts";
import type { PairingStatus } from "../../core/pairing/pairingStatus.ts";
import type { IdentityStore } from "../identity/identityStore.ts";
import { codeOffer } from "./codeOffer.ts";
import {
  type DeviceAuthClient,
  pollDeviceToken,
  requestDeviceCode,
} from "./deviceFlow.ts";
import { completeClaim, type OpenCode } from "./pairingCompletion.ts";

const SLOW_DOWN_STEP_MS = 2000;
const MS_PER_SECOND = 1000;
const SLOW_AFTER_MS = 6000;
const NETWORK_CHECK_MS = 2000;

const refusedByServer: CodeEvent = { kind: "refused", reason: "server" };

type Claim = { open: OpenCode; sessionToken: string | null };

type PairingSessionOptions = {
  apiUrl: string;
  authClient: DeviceAuthClient;
  identity: IdentityStore;
  device: () => DeviceDescription;
  lanEndpoint: () => LanEndpoint | null;
  lanListening: () => boolean;
  isOnline: () => boolean;
  logger: Logger;
  onStatus: (status: PairingStatus) => void;
  onReplaced: (phones: readonly PairedPhone[]) => void;
};

export class PairingSession {
  readonly #options: PairingSessionOptions;
  #run: AbortController | null = null;
  #code: CodeState = idleCode;
  #claim: Claim | null = null;

  constructor(options: PairingSessionOptions) {
    this.#options = options;
  }

  start(): void {
    if (this.#run) return;
    this.#launch({ kind: "begin", online: this.#options.isOnline() });
  }

  resume(): void {
    if (this.#run || this.#code.status.kind !== "offering") return;
    this.#launch({ kind: "resumed", now: Date.now() });
  }

  pause(): void {
    if (this.#code.status.kind !== "offering") {
      this.stop();
      return;
    }
    this.#run?.abort();
    this.#run = null;
  }

  stop(): void {
    // The phone has already approved this code, so the claim must finish or
    // the phone is linked on the server but never saved on this Mac.
    if (this.#code.status.kind === "scanned") return;
    this.#run?.abort();
    this.#run = null;
    this.#claim = null;
    if (!keepsCurrentCode(this.#code.status)) return;
    this.#code = idleCode;
    this.#options.onStatus(idleCode.status);
  }

  #launch(first: CodeEvent): void {
    const run = new AbortController();
    this.#run = run;
    void this.#drive(first, run.signal)
      .catch((error: unknown) => {
        this.#options.logger.error("pairing", "Pairing session broke", error);
        if (!run.signal.aborted) this.#advance(refusedByServer);
      })
      .finally(() => {
        if (this.#run === run) this.#run = null;
      });
  }

  async #drive(first: CodeEvent, signal: AbortSignal): Promise<void> {
    let effect = this.#advance(first);
    while (effect !== "none") {
      const event = await this.#perform(effect, signal);
      if (signal.aborted && !finishesWhenPaused(effect, event)) return;
      effect = this.#advance(event);
    }
  }

  #advance(event: CodeEvent): CodeEffect {
    const step = codeStep(this.#code, event);
    const changed = step.state.status !== this.#code.status;
    this.#code = step.state;
    if (changed) this.#options.onStatus(step.state.status);
    return step.effect;
  }

  #perform(
    effect: Exclude<CodeEffect, "none">,
    signal: AbortSignal,
  ): Promise<CodeEvent> {
    switch (effect) {
      case "request":
        return this.#request(signal);
      case "awaitNetwork":
        return this.#awaitNetwork(signal);
      case "poll":
        return this.#awaitApproval(signal);
      case "complete":
        return this.#complete();
      default: {
        const unhandled: never = effect;
        return unhandled;
      }
    }
  }

  async #request(signal: AbortSignal): Promise<CodeEvent> {
    const slow = setTimeout(() => {
      if (!signal.aborted) this.#advance({ kind: "slow" });
    }, SLOW_AFTER_MS);
    const requested = await requestDeviceCode(this.#options.authClient);
    clearTimeout(slow);
    if (requested.kind === "failed") {
      const online = this.#options.isOnline();
      return { kind: "missed", failure: requested.failure, online };
    }
    const open = { code: requested.code, pairingSecret: randomSecret() };
    if (!signal.aborted) this.#claim = { open, sessionToken: null };
    return { kind: "issued", offer: codeOffer(this.#options, open) };
  }

  async #awaitNetwork(signal: AbortSignal): Promise<CodeEvent> {
    while (!signal.aborted && !this.#options.isOnline()) {
      await sleep(NETWORK_CHECK_MS, undefined, { signal }).catch(() => null);
    }
    return { kind: "online" };
  }

  async #awaitApproval(signal: AbortSignal): Promise<CodeEvent> {
    const claim = this.#claim;
    if (!claim) return refusedByServer;
    const { deviceCode, expiresAt } = claim.open.code;
    const dueAt = expiresAt * MS_PER_SECOND;
    let intervalMs = claim.open.code.intervalMs;
    const stillOffered = () => this.#code.status.kind === "offering";
    while (!signal.aborted && stillOffered() && Date.now() < dueAt) {
      const waitMs = Math.min(intervalMs, dueAt - Date.now());
      await sleep(waitMs, undefined, { signal }).catch(() => null);
      if (signal.aborted || !stillOffered() || Date.now() >= dueAt) break;
      const { authClient } = this.#options;
      const polled = await pollDeviceToken(authClient, deviceCode);
      if (polled.kind === "approved") {
        claim.sessionToken = polled.sessionToken;
        return { kind: "approved" };
      }
      if (polled.kind === "expired") break;
      if (polled.kind === "failed") return refusedByServer;
      if (polled.kind === "slowDown") intervalMs += SLOW_DOWN_STEP_MS;
    }
    return { kind: "due" };
  }

  #complete(): Promise<CodeEvent> {
    const claim = this.#claim;
    if (!claim?.sessionToken) return Promise.resolve(refusedByServer);
    const { apiUrl, identity, device, logger, onReplaced } = this.#options;
    const desktop = device();
    const completion = { apiUrl, identity, logger, onReplaced, desktop };
    return completeClaim(completion, claim.open, claim.sessionToken);
  }
}
