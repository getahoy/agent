import { agentCopy } from "../copy/agentCopy.ts";
import { useAgentState } from "./hooks/useAgentState.ts";
import { PairStep } from "./setup/pairStep.tsx";
import { PermissionsStep } from "./setup/permissionsStep.tsx";
import { WelcomeStep } from "./setup/welcomeStep.tsx";
import { WindowApp } from "./window/windowApp.tsx";

export function AgentApp() {
  const state = useAgentState();
  if (!state) {
    return (
      <p className="p-8 text-driftwood text-ui" aria-busy="true">
        {agentCopy.loading}
      </p>
    );
  }

  switch (state.screen) {
    case "welcome":
      return <WelcomeStep />;
    case "permissions":
      if (state.onboardingStep === "done") {
        return (
          <WindowApp
            key="permissions"
            state={state}
            initialPage="permissions"
          />
        );
      }
      return <PermissionsStep permissions={state.permissions} />;
    case "pair":
      return <PairStep state={state} />;
    case "home":
      return <WindowApp key="home" state={state} initialPage="home" />;
    default: {
      const unhandled: never = state.screen;
      return unhandled;
    }
  }
}
