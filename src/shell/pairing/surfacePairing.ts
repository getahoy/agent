import type { AgentState } from "../../core/appState/appState.ts";
import { pairingMove } from "../../core/pairing/pairingMove.ts";
import type { AgentController } from "../agentController.ts";
import type { PairingSession } from "./pairingSession.ts";

type SurfacePairingOptions = {
  controller: AgentController;
  pairing: PairingSession;
  surfaceVisible: () => boolean;
  trace: ((message: string) => void) | null;
};

function endedToShownTrace(
  trace: (message: string) => void,
  initial: AgentState,
) {
  let phones = initial.pairedPhones.length;
  let endedAt: number | null = null;
  return (state: AgentState) => {
    if (phones > 0 && state.pairedPhones.length === 0) endedAt = Date.now();
    phones = state.pairedPhones.length;
    if (endedAt === null || state.pairing.kind !== "offering") return;
    trace(`code shown ${Date.now() - endedAt}ms after the phone ended`);
    endedAt = null;
  };
}

export function surfacePairing(options: SurfacePairingOptions) {
  const { controller, pairing, surfaceVisible, trace } = options;
  const traceShown = trace && endedToShownTrace(trace, controller.state());
  const apply = () => {
    const state = controller.state();
    const move = pairingMove({ surfaceVisible: surfaceVisible(), state });
    if (move === "start") pairing.start();
    if (move === "stop") pairing.stop();
  };
  // Starting emits a new status, so it waits until every listener has seen
  // the change that asked for it.
  controller.onChange((state) => {
    traceShown?.(state);
    queueMicrotask(apply);
  });
  return {
    start: () => {
      if (surfaceVisible()) pairing.start();
    },
    visibilityChanged: apply,
  };
}
