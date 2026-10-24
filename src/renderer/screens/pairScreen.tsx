import { agentCopy } from "../../copy/agentCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import { PairedPhoneList } from "../components/pairedPhoneList.tsx";
import { PairingPanel } from "../components/pairingPanel.tsx";
import { ScreenLayout } from "../components/screenLayout.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePairingSession } from "../hooks/usePairingSession.ts";

type PairScreenProps = { state: AgentState };

export function PairScreen({ state }: PairScreenProps) {
  usePairingSession();
  const actions = useAgentActions();
  const firstRun = state.onboardingStep === "pair";
  const finish = firstRun
    ? () => actions.completeStep("pair")
    : () => actions.startPairing();

  return (
    <ScreenLayout title={agentCopy["pair.title"]} helper={state.helper}>
      <PairingPanel
        status={state.pairing}
        finishLabel={agentCopy[firstRun ? "pair.done" : "pair.another"]}
        onFinish={() => void finish()}
        onRetry={() => void actions.startPairing()}
      />
      <PairedPhoneList
        phones={state.pairedPhones}
        onRemove={(publicKey) => void actions.unpairPhone(publicKey)}
      />
    </ScreenLayout>
  );
}
