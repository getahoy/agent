import { z } from "zod";
import type { Permission } from "../../ports/platform.ts";
import type { AgentState, OnboardingStep } from "./appState.ts";

export const bridgeChannels = {
  getState: "agent:get-state",
  state: "agent:state",
  completeStep: "agent:complete-step",
  openPermissionSettings: "agent:open-permission-settings",
  relaunch: "agent:relaunch",
  startPairing: "agent:start-pairing",
  stopPairing: "agent:stop-pairing",
  unpairPhone: "agent:unpair-phone",
  signOut: "agent:sign-out",
  requestNewPhone: "agent:request-new-phone",
  cancelNewPhone: "agent:cancel-new-phone",
  finishPairing: "agent:finish-pairing",
  dismissNotice: "agent:dismiss-notice",
  setLanEnabled: "agent:set-lan-enabled",
  openWindow: "agent:open-window",
  quit: "agent:quit",
} as const;

export const permissionSchema = z.enum(["accessibility", "screenRecording"]);

export type AgentBridge = {
  getState: () => Promise<AgentState>;
  onState: (listener: (state: AgentState) => void) => () => void;
  completeStep: (step: OnboardingStep) => Promise<void>;
  openPermissionSettings: (permission: Permission) => Promise<void>;
  relaunch: () => Promise<void>;
  startPairing: () => Promise<void>;
  stopPairing: () => Promise<void>;
  unpairPhone: (publicKey: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestNewPhone: () => Promise<void>;
  cancelNewPhone: () => Promise<void>;
  finishPairing: () => Promise<void>;
  dismissNotice: () => Promise<void>;
  setLanEnabled: (enabled: boolean) => Promise<void>;
  openWindow: () => Promise<void>;
  quit: () => Promise<void>;
};
