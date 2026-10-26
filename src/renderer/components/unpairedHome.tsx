import type { AgentState } from "../../core/appState/appState.ts";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePairingSession } from "../hooks/usePairingSession.ts";
import { PairingPanel } from "./pairingPanel.tsx";

type UnpairedHomeProps = { state: AgentState };

export function UnpairedHome({ state }: UnpairedHomeProps) {
  usePairingSession();
  const actions = useAgentActions();
  return (
    <PairingPanel
      status={state.pairing}
      onFinish={() => void actions.finishPairing()}
      onRetry={() => void actions.startPairing()}
    />
  );
}
