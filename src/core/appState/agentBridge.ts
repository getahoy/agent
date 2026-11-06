import { z } from "zod";
import type { Permission } from "../../ports/platform.ts";
import type { AgentState, OnboardingStep } from "./appState.ts";
import type { HistoryBridge } from "./historyBridge.ts";
import type { OffDuration } from "./listenOff.ts";

export const bridgeChannels = {
  getState: "agent:get-state",
  state: "agent:state",
  completeStep: "agent:complete-step",
  openPermissionSettings: "agent:open-permission-settings",
  relaunch: "agent:relaunch",
  startPairing: "agent:start-pairing",
  unpairPhone: "agent:unpair-phone",
  signOut: "agent:sign-out",
  requestNewPhone: "agent:request-new-phone",
  cancelNewPhone: "agent:cancel-new-phone",
  finishPairing: "agent:finish-pairing",
  turnOn: "agent:turn-on",
  turnOff: "agent:turn-off",
  openWindow: "agent:open-window",
  quit: "agent:quit",
  setPopoverHeight: "agent:set-popover-height",
  devLog: "agent:dev-log",
} as const;

export const popoverHeightSchema = z.number().positive().finite();

export const permissionSchema = z.enum(["accessibility", "screenRecording"]);

export type AgentBridge = HistoryBridge & {
  getState: () => Promise<AgentState>;
  onState: (listener: (state: AgentState) => void) => () => void;
  completeStep: (step: OnboardingStep) => Promise<void>;
  openPermissionSettings: (permission: Permission) => Promise<void>;
  relaunch: () => Promise<void>;
  startPairing: () => Promise<void>;
  unpairPhone: (publicKey: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestNewPhone: () => Promise<void>;
  cancelNewPhone: () => Promise<void>;
  finishPairing: () => Promise<void>;
  turnOn: () => Promise<void>;
  turnOff: (duration: OffDuration) => Promise<void>;
  openWindow: () => Promise<void>;
  quit: () => Promise<void>;
  setPopoverHeight: (height: number) => Promise<void>;
  devLog: (scope: string, message: string) => void;
};
