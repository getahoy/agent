import type { Appearance } from "@getahoy/lib";
import {
  type AgentFacts,
  type AgentState,
  afterPhoneEnded,
  agentState,
  type OnboardingStep,
  type PhoneSummary,
  stepAfter,
} from "../core/appState/appState.ts";
import type { HelperEvent } from "../core/helper/helperProtocol.ts";
import type { EndedByPhone } from "../core/pairing/endedByPhone.ts";
import type { PairedPhone } from "../core/pairing/pairedPhone.ts";
import type { PairingStatus } from "../core/pairing/pairingStatus.ts";
import type { PlatformAdapter } from "../ports/platform.ts";
import { type Settings, writeSettings } from "./settingsStore.ts";
import { traceCaller } from "./traceCaller.ts";

const PERMISSION_POLL_MS = 2000;

type StateListener = (state: AgentState) => void;

type AgentControllerOptions = {
  platform: PlatformAdapter;
  settings: Settings;
  pairedPhones: readonly PairedPhone[];
  trace: ((message: string) => void) | null;
};

const TRACED_FACTS = ["pairedPhones", "pairing", "endedNotice"] as const;

function summarise(phones: readonly PairedPhone[]): PhoneSummary[] {
  return phones.map(({ publicKey, displayName, accountEmail, pairedAt }) => ({
    publicKey,
    displayName,
    accountEmail,
    pairedAt,
  }));
}

export class AgentController {
  readonly #platform: PlatformAdapter;
  readonly #listeners = new Set<StateListener>();
  #settings: Settings;
  #facts: AgentFacts;
  #pollTimer: NodeJS.Timeout | null = null;
  readonly #trace: ((message: string) => void) | null;

  constructor(options: AgentControllerOptions) {
    const { platform, settings, pairedPhones } = options;
    this.#platform = platform;
    this.#settings = settings;
    this.#trace = options.trace;
    this.#facts = {
      onboardingStep: settings.onboardingStep,
      permissions: platform.permissions.read(),
      helper: "starting",
      screenLocked: false,
      pairing: { kind: "idle" },
      pairedPhones: summarise(pairedPhones),
      lanEnabled: settings.lanEnabled,
      connectedPhoneKeys: [],
      pausedPhoneKeys: [],
      lastConnectedAt: null,
      endedNotice: null,
      pairingNewPhone: false,
      lastHeard: null,
    };
  }

  state(): AgentState {
    return agentState(this.#facts);
  }

  onChange(listener: StateListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  startPermissionPolling(): void {
    this.#pollTimer = setInterval(() => {
      const permissions = this.#platform.permissions.read();
      const current = this.#facts.permissions;
      if (
        permissions.accessibility === current.accessibility &&
        permissions.screenRecording === current.screenRecording
      ) {
        return;
      }
      this.#update({ permissions });
    }, PERMISSION_POLL_MS);
  }

  stopPermissionPolling(): void {
    if (this.#pollTimer) clearInterval(this.#pollTimer);
    this.#pollTimer = null;
  }

  async completeStep(step: OnboardingStep): Promise<void> {
    if (step !== this.#facts.onboardingStep) return;
    const onboardingStep = stepAfter(step);
    await this.#saveSettings({ onboardingStep });
    this.#update({ onboardingStep });
  }

  lanOffUntil(): number | null {
    return this.#settings.lanOffUntil;
  }

  appearance(): Appearance {
    return this.#settings.appearance;
  }

  setAppearance(appearance: Appearance): Promise<void> {
    return this.#saveSettings({ appearance });
  }

  // State first: a phone handshaking during the file write sees the new answer.
  turnListeningOn(): Promise<void> {
    this.#update({ lanEnabled: true });
    return this.#saveSettings({ lanEnabled: true, lanOffUntil: null });
  }

  turnListeningOff(lanOffUntil: number | null): Promise<void> {
    this.#update({ lanEnabled: false, connectedPhoneKeys: [] });
    return this.#saveSettings({ lanEnabled: false, lanOffUntil });
  }

  setPairing(pairing: PairingStatus, pairedPhones: readonly PairedPhone[]) {
    const endedNotice =
      pairing.kind === "paired" ? null : this.#facts.endedNotice;
    this.#update({
      pairing,
      pairedPhones: summarise(pairedPhones),
      endedNotice,
    });
  }

  setPairedPhones(pairedPhones: readonly PairedPhone[]): void {
    this.#update({ pairedPhones: summarise(pairedPhones) });
  }

  setConnectedPhones(connectedPhoneKeys: string[]): void {
    const pausedPhoneKeys = this.#facts.pausedPhoneKeys.filter(
      (key) => !connectedPhoneKeys.includes(key),
    );
    const lastConnectedAt = Date.now();
    this.#update({ connectedPhoneKeys, pausedPhoneKeys, lastConnectedAt });
  }

  setPhonePaused(publicKey: string): void {
    const paused = new Set([...this.#facts.pausedPhoneKeys, publicKey]);
    this.#update({ pausedPhoneKeys: [...paused] });
  }

  phoneEnded(
    pairedPhones: readonly PairedPhone[],
    notice: EndedByPhone | null,
  ): void {
    this.#update(afterPhoneEnded(this.#facts, summarise(pairedPhones), notice));
  }

  setPairingNewPhone(pairingNewPhone: boolean): void {
    this.#update({ pairingNewPhone });
  }

  async finishPairing(): Promise<void> {
    this.#update({ pairingNewPhone: false, pairing: { kind: "idle" } });
    await this.completeStep("pair");
  }

  handleHelperEvent(event: HelperEvent): void {
    if (event === "ready") this.#update({ helper: "running" });
    if (event === "exited") this.#update({ helper: "stopped" });
  }

  showLastHeard(text: string): void {
    this.#update({ lastHeard: { text, at: Date.now() } });
  }

  setScreenLocked(screenLocked: boolean): void {
    this.#update({ screenLocked });
  }

  async #saveSettings(change: Partial<Settings>): Promise<void> {
    this.#settings = { ...this.#settings, ...change };
    await writeSettings(this.#platform.settingsFilePath(), this.#settings);
  }

  #update(change: Partial<AgentFacts>): void {
    const traced = TRACED_FACTS.filter((key) => key in change);
    if (this.#trace && traced.length > 0) {
      this.#trace(`${traced.join(", ")} by ${traceCaller()}`);
    }
    this.#facts = { ...this.#facts, ...change };
    const state = this.state();
    for (const listener of this.#listeners) listener(state);
  }
}
