import {
  type AgentFacts,
  type AgentState,
  agentState,
  type EndedNotice,
  type OnboardingStep,
  type PhoneSummary,
  stepAfter,
} from "../core/appState/appState.ts";
import type { HelperEvent } from "../core/helper/helperProtocol.ts";
import type { PairedPhone } from "../core/pairing/pairedPhone.ts";
import type { PairingStatus } from "../core/pairing/pairingStatus.ts";
import type { PlatformAdapter } from "../ports/platform.ts";
import { type Settings, writeSettings } from "./settingsStore.ts";

const PERMISSION_POLL_MS = 2000;

type StateListener = (state: AgentState) => void;

function summarise(phones: readonly PairedPhone[]): PhoneSummary[] {
  return phones.map(({ publicKey, displayName, accountEmail }) => ({
    publicKey,
    displayName,
    accountEmail,
  }));
}

export class AgentController {
  readonly #platform: PlatformAdapter;
  readonly #listeners = new Set<StateListener>();
  #settings: Settings;
  #facts: AgentFacts;
  #pollTimer: NodeJS.Timeout | null = null;

  constructor(
    platform: PlatformAdapter,
    settings: Settings,
    pairedPhones: readonly PairedPhone[],
  ) {
    this.#platform = platform;
    this.#settings = settings;
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

  async setLanEnabled(lanEnabled: boolean): Promise<void> {
    await this.#saveSettings({ lanEnabled });
    this.#update({ lanEnabled, connectedPhoneKeys: [] });
  }

  setPairing(pairing: PairingStatus, pairedPhones: readonly PairedPhone[]) {
    this.#update({ pairing, pairedPhones: summarise(pairedPhones) });
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

  showEndedNotice(endedNotice: EndedNotice): void {
    this.#update({ endedNotice });
  }

  dismissEndedNotice(): void {
    this.#update({ endedNotice: null });
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
    this.#facts = { ...this.#facts, ...change };
    const state = this.state();
    for (const listener of this.#listeners) listener(state);
  }
}
