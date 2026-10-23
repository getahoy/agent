import type { OnboardingStep } from "../../core/appState/appState.ts";
import type { Permission } from "../../ports/platform.ts";

export function useAgentActions() {
  return {
    completeStep: (step: OnboardingStep) => window.ahoy.completeStep(step),
    openPermissionSettings: (permission: Permission) =>
      window.ahoy.openPermissionSettings(permission),
    relaunch: () => window.ahoy.relaunch(),
    startPairing: () => window.ahoy.startPairing(),
  };
}
