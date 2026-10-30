import { agentCopy } from "../copy/agentCopy.ts";
import { useAgentState } from "./hooks/useAgentState.ts";
import { PairScreen } from "./screens/pairScreen.tsx";
import { PermissionsScreen } from "./screens/permissionsScreen.tsx";
import { WelcomeScreen } from "./screens/welcomeScreen.tsx";
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
      return <WelcomeScreen state={state} />;
    case "permissions":
      return <PermissionsScreen state={state} />;
    case "pair":
      return <PairScreen state={state} />;
    case "home":
      return <WindowApp state={state} initialPage="home" />;
    default: {
      const unhandled: never = state.screen;
      return unhandled;
    }
  }
}
