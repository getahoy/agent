import { agentCopy } from "../../copy/agentCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import { ScreenLayout } from "../components/screenLayout.tsx";

type PairScreenProps = { state: AgentState };

export function PairScreen({ state }: PairScreenProps) {
  return (
    <ScreenLayout title={agentCopy["pair.title"]} helper={state.helper}>
      <p>{agentCopy["pair.body"]}</p>
    </ScreenLayout>
  );
}
