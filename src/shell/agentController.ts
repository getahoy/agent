import {
  type AgentFacts,
  type AgentState,
  agentState,
  type OnboardingStep,
  stepAfter,
} from "../core/appState/appState.ts";
import type { HelperEvent } from "../core/helper/helperProtocol.ts";
import type { PlatformAdapter } from "../ports/platform.ts";
import { type Settings, writeSettings } from "./settingsStore.ts";

const PERMISSION_POLL_MS = 2000;

type StateListener = (state: AgentState) => void;

export class AgentController {
  readonly #platform: PlatformAdapter;
  readonly #listeners = new Set<StateListener>();
  #facts: AgentFacts;
  #pollTimer: NodeJS.Timeout | null = null;

  constructor(platform: PlatformAdapter, settings: Settings) {
    this.#platform = platform;
    this.#facts = {
      onboardingStep: settings.onboardingStep,
      permissions: platform.permissions.read(),
      helper: "starting",
      screenLocked: false,
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
    await writeSettings(this.#platform.settingsFilePath(), { onboardingStep });
    this.#update({ onboardingStep });
  }

  handleHelperEvent(event: HelperEvent): void {
    if (event === "ready") this.#update({ helper: "running" });
    if (event === "exited") this.#update({ helper: "stopped" });
  }

  setScreenLocked(screenLocked: boolean): void {
    this.#update({ screenLocked });
  }

  #update(change: Partial<AgentFacts>): void {
    this.#facts = { ...this.#facts, ...change };
    const state = this.state();
    for (const listener of this.#listeners) listener(state);
  }
}
