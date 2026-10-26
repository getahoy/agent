import { agentCopy } from "../copy/agentCopy.ts";
import { useAgentState } from "./hooks/useAgentState.ts";
import { HomeScreen } from "./screens/homeScreen.tsx";
import { PairScreen } from "./screens/pairScreen.tsx";
import { PermissionsScreen } from "./screens/permissionsScreen.tsx";
import { WelcomeScreen } from "./screens/welcomeScreen.tsx";

export function AgentApp() {
  const state = useAgentState();
  if (!state) {
    return (
      <p className="p-8 text-muted" aria-busy="true">
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
      return <HomeScreen state={state} />;
    default: {
      const unhandled: never = state.screen;
      return unhandled;
    }
  }
}
