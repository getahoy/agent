import { agentCopy } from "../../copy/agentCopy.ts";
import { homeCopy } from "../../copy/homeCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import { Button } from "../components/ui/button.tsx";
import { Text } from "../components/ui/text.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePairingSession } from "../hooks/usePairingSession.ts";
import { usePendingAction } from "../hooks/usePendingAction.ts";
import { EndedMessage } from "../pairing/endedMessage.tsx";
import { PairingPanel } from "../pairing/pairingPanel.tsx";
import { shownEndedNotice } from "../pairing/shownEndedNotice.ts";
import { SetupFrame } from "./setupFrame.tsx";

const PAIR_STEP = 2;

type PairStepProps = { state: AgentState };

export function PairStep({ state }: PairStepProps) {
  usePairingSession(
    state.pairing.kind === "idle" && state.pairedPhones.length === 0,
  );
  const actions = useAgentActions();
  const [cancel, cancelling] = usePendingAction(actions.cancelNewPhone);
  const [currentPhone] = state.pairedPhones;
  const offering = state.pairing.kind !== "paired";
  const replacing = state.pairingNewPhone && offering && currentPhone;
  const ended = shownEndedNotice(state);
  const title = state.pairingNewPhone ? "pair.newTitle" : "pair.title";
  return (
    <SetupFrame step={state.pairingNewPhone ? null : PAIR_STEP}>
      {ended && offering ? (
        <EndedMessage notice={ended} place="pairPage" />
      ) : null}
      {!ended && offering ? (
        <Text as="h1" variant="setup">
          {agentCopy[title]}
        </Text>
      ) : null}
      {replacing ? (
        <Text variant="muted">
          {homeCopy.newPhoneHint(currentPhone.displayName)}
        </Text>
      ) : null}
      <PairingPanel status={state.pairing} />
      {replacing ? (
        <Button
          variant="secondary"
          size="sm"
          pending={cancelling}
          onClick={cancel}
        >
          {agentCopy["pair.cancel"]}
        </Button>
      ) : null}
    </SetupFrame>
  );
}
