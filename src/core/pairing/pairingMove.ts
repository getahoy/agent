import { type AgentState, needsPairingCode } from "../appState/appState.ts";

export type PairingMove = "start" | "stop" | "keep";

type PairingScene = { surfaceVisible: boolean; state: AgentState };

export function pairingMove({
  surfaceVisible,
  state,
}: PairingScene): PairingMove {
  if (!surfaceVisible) return "stop";
  return needsPairingCode(state) ? "start" : "keep";
}
