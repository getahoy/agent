import { type AgentState, needsPairingCode } from "../appState/appState.ts";

export type PairingMove = "start" | "resume" | "pause";

type PairingScene = { surfaceVisible: boolean; state: AgentState };

export function pairingMove({
  surfaceVisible,
  state,
}: PairingScene): PairingMove {
  if (!surfaceVisible) return "pause";
  return needsPairingCode(state) ? "start" : "resume";
}
