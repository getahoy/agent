import { agentCopy } from "../../copy/agentCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import { ActionButton } from "../components/actionButton.tsx";
import { ScreenLayout } from "../components/screenLayout.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";

type WelcomeScreenProps = { state: AgentState };

export function WelcomeScreen({ state }: WelcomeScreenProps) {
  const actions = useAgentActions();

  return (
    <ScreenLayout title={agentCopy["welcome.title"]} helper={state.helper}>
      <p>{agentCopy["welcome.body"]}</p>
      <div>
        <ActionButton onPress={() => void actions.completeStep("welcome")}>
          {agentCopy["welcome.continue"]}
        </ActionButton>
      </div>
    </ScreenLayout>
  );
}
