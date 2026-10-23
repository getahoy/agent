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
};
