import { z } from "zod";
import type { MenubarStatus, PermissionState } from "../../ports/platform.ts";
import type { EndedByPhone } from "../pairing/endedByPhone.ts";
import { pairingStatusSchema } from "../pairing/pairingStatus.ts";

export const onboardingStepSchema = z.enum([
  "welcome",
  "permissions",
  "pair",
  "done",
]);

const helperStatusSchema = z.enum(["starting", "running", "stopped"]);
const windowScreenSchema = z.enum(["welcome", "permissions", "pair", "home"]);
const phoneSummarySchema = z.object({
  publicKey: z.string(),
  displayName: z.string(),
  accountEmail: z.string(),
  pairedAt: z.int(),
});
const endedNoticeSchema: z.ZodType<EndedByPhone> = z.object({
  reason: z.enum(["removed", "signed_out"]),
  deviceName: z.string(),
  at: z.int(),
  whileAsleep: z.boolean(),
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
  connectedPhoneKeys: z.array(z.string()),
  pausedPhoneKeys: z.array(z.string()),
  lastConnectedAt: z.int().nullable(),
  endedNotice: endedNoticeSchema.nullable(),
  pairingNewPhone: z.boolean(),
  lastHeard: z.object({ text: z.string(), at: z.int() }).nullable(),
  screen: windowScreenSchema,
});

export type OnboardingStep = z.infer<typeof onboardingStepSchema>;
export type HelperStatus = z.infer<typeof helperStatusSchema>;
type WindowScreen = z.infer<typeof windowScreenSchema>;
export type PhoneSummary = z.infer<typeof phoneSummarySchema>;
export type AgentState = z.infer<typeof agentStateSchema>;
export type AgentFacts = Omit<AgentState, "screen">;

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
  if (facts.onboardingStep === "pair" || facts.pairingNewPhone) return "pair";
  return "home";
}

export function menubarStatus(facts: AgentFacts): MenubarStatus {
  if (facts.helper === "stopped") return "needsPermission";
  if (!facts.permissions.accessibility) return "needsPermission";
  if (!facts.lanEnabled || facts.screenLocked) return "off";
  return facts.connectedPhoneKeys.length > 0 ? "connected" : "noPhone";
}

export function agentState(facts: AgentFacts): AgentState {
  return { ...facts, screen: windowScreen(facts) };
}
