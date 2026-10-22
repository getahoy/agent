import { z } from "zod";
import type { PermissionState } from "../../ports/platform.ts";

export const onboardingStepSchema = z.enum([
  "welcome",
  "permissions",
  "pair",
  "done",
]);

const helperStatusSchema = z.enum(["starting", "running", "stopped"]);
const windowScreenSchema = z.enum(["welcome", "permissions", "pair"]);

export const agentStateSchema = z.object({
  onboardingStep: onboardingStepSchema,
  permissions: z.object({
    accessibility: z.boolean(),
    screenRecording: z.boolean(),
  }),
  helper: helperStatusSchema,
  screenLocked: z.boolean(),
  screen: windowScreenSchema,
});

export type OnboardingStep = z.infer<typeof onboardingStepSchema>;
export type HelperStatus = z.infer<typeof helperStatusSchema>;
export type WindowScreen = z.infer<typeof windowScreenSchema>;
export type AgentState = z.infer<typeof agentStateSchema>;

export type AgentFacts = {
  onboardingStep: OnboardingStep;
  permissions: PermissionState;
  helper: HelperStatus;
  screenLocked: boolean;
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

export function windowScreen(facts: AgentFacts): WindowScreen {
  if (facts.onboardingStep === "welcome") return "welcome";
  if (facts.onboardingStep === "permissions") return "permissions";
  if (!allPermissionsGranted(facts.permissions)) return "permissions";
  return "pair";
}

export function agentState(facts: AgentFacts): AgentState {
  return { ...facts, screen: windowScreen(facts) };
}
