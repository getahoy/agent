import { z } from "zod";
import type { MenubarStatus, PermissionState } from "../../ports/platform.ts";
import {
  type PairingStatus,
  pairingStatusSchema,
} from "../pairing/pairingStatus.ts";

export const onboardingStepSchema = z.enum([
  "welcome",
  "permissions",
  "pair",
  "done",
]);

const helperStatusSchema = z.enum(["starting", "running", "stopped"]);
const windowScreenSchema = z.enum(["welcome", "permissions", "pair"]);
const phoneSummarySchema = z.object({
  publicKey: z.string(),
  displayName: z.string(),
  accountEmail: z.string(),
});

export const agentStateSchema = z.object({
  onboardingStep: onboardingStepSchema,
  permissions: z.object({
    accessibility: z.boolean(),
    screenRecording: z.boolean(),
  }),
  helper: helperStatusSchema,
  screenLocked: z.boolean(),
  pairing: pairingStatusSchema,
  pairedPhones: z.array(phoneSummarySchema),
  lanEnabled: z.boolean(),
  connectedPhones: z.array(z.string()),
  screen: windowScreenSchema,
});

export type OnboardingStep = z.infer<typeof onboardingStepSchema>;
export type HelperStatus = z.infer<typeof helperStatusSchema>;
type WindowScreen = z.infer<typeof windowScreenSchema>;
export type PhoneSummary = z.infer<typeof phoneSummarySchema>;
export type AgentState = z.infer<typeof agentStateSchema>;

export type AgentFacts = {
  onboardingStep: OnboardingStep;
  permissions: PermissionState;
  helper: HelperStatus;
  screenLocked: boolean;
  pairing: PairingStatus;
  pairedPhones: PhoneSummary[];
  lanEnabled: boolean;
  connectedPhones: string[];
};

const nextStepAfter: Record<OnboardingStep, OnboardingStep> = {
  welcome: "permissions",
  permissions: "pair",
  pair: "done",
  done: "done",
};

export function stepAfter(step: OnboardingStep): OnboardingStep {
  return nextStepAfter[step];
}

export function allPermissionsGranted(permissions: PermissionState): boolean {
  return permissions.accessibility && permissions.screenRecording;
}

function windowScreen(facts: AgentFacts): WindowScreen {
  if (facts.onboardingStep === "welcome") return "welcome";
  if (facts.onboardingStep === "permissions") return "permissions";
  if (!allPermissionsGranted(facts.permissions)) return "permissions";
  return "pair";
}

export function menubarStatus(facts: AgentFacts): MenubarStatus {
  if (facts.helper === "stopped") return "error";
  if (!allPermissionsGranted(facts.permissions)) return "error";
  if (!facts.lanEnabled) return "off";
  return facts.connectedPhones.length > 0 ? "connected" : "disconnected";
}

export function agentState(facts: AgentFacts): AgentState {
  return { ...facts, screen: windowScreen(facts) };
}
