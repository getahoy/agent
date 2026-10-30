import type { OnboardingStep } from "../../core/appState/appState.ts";
import type { Permission } from "../../ports/platform.ts";

export function useAgentActions() {
  const { ahoy } = window;
  return {
    completeStep: (step: OnboardingStep) => ahoy.completeStep(step),
    openPermissionSettings: (permission: Permission) =>
      ahoy.openPermissionSettings(permission),
    relaunch: () => ahoy.relaunch(),
    startPairing: () => ahoy.startPairing(),
    unpairPhone: (publicKey: string) => ahoy.unpairPhone(publicKey),
    signOut: () => ahoy.signOut(),
    requestNewPhone: () => ahoy.requestNewPhone(),
    cancelNewPhone: () => ahoy.cancelNewPhone(),
    finishPairing: () => ahoy.finishPairing(),
    dismissNotice: () => ahoy.dismissNotice(),
    setLanEnabled: (enabled: boolean) => ahoy.setLanEnabled(enabled),
    openWindow: () => ahoy.openWindow(),
    quit: () => ahoy.quit(),
  };
}
