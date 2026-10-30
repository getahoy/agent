import { agentCopy } from "../../copy/agentCopy.ts";
import { homeCopy } from "../../copy/homeCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import { ActionButton } from "../components/actionButton.tsx";
import { ScreenLayout } from "../components/screenLayout.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePairingSession } from "../hooks/usePairingSession.ts";
import { PairingPanel } from "../pairing/pairingPanel.tsx";

type PairScreenProps = { state: AgentState };

export function PairScreen({ state }: PairScreenProps) {
  usePairingSession();
  const actions = useAgentActions();
  const [currentPhone] = state.pairedPhones;
  const replacing = state.pairingNewPhone && currentPhone !== undefined;
  const offering = state.pairing.kind !== "paired";

  return (
    <ScreenLayout
      title={agentCopy[state.pairingNewPhone ? "pair.newTitle" : "pair.title"]}
      helper={state.helper}
    >
      {replacing && offering ? (
        <p className="text-muted text-sm">
          {homeCopy.newPhoneHint(currentPhone.displayName)}
        </p>
      ) : null}
      <PairingPanel status={state.pairing} />
      {state.pairingNewPhone && offering ? (
        <div>
          <ActionButton
            tone="plain"
            onPress={() => void actions.cancelNewPhone()}
          >
            {agentCopy["pair.cancel"]}
          </ActionButton>
        </div>
      ) : null}
    </ScreenLayout>
  );
}
