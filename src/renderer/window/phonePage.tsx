import { agentCopy } from "../../copy/agentCopy.ts";
import { homeCopy } from "../../copy/homeCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import { Button } from "../components/ui/button.tsx";
import { ListGroup } from "../components/ui/listGroup.tsx";
import { ListRow } from "../components/ui/listRow.tsx";
import { Text } from "../components/ui/text.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePendingAction } from "../hooks/usePendingAction.ts";
import { phoneLink } from "../phone/phoneLink.ts";
import { PairedPhoneRow } from "./pairedPhoneRow.tsx";

type PhonePageProps = { state: AgentState; onPairFirst: () => void };

export function PhonePage({ state, onPairFirst }: PhonePageProps) {
  const actions = useAgentActions();
  const [pairNew, starting] = usePendingAction(actions.requestNewPhone);
  const link = phoneLink(state);
  return (
    <>
      <Text as="h1" variant="title">
        {agentCopy["nav.phone"]}
      </Text>
      <ListGroup label={agentCopy["nav.phone"]}>
        {link.kind === "none" ? (
          <ListRow title={agentCopy["menubar.noPhone"]} />
        ) : (
          <PairedPhoneRow
            phone={link.phone}
            connected={link.kind === "connected"}
            lastConnectedAt={state.lastConnectedAt}
          />
        )}
      </ListGroup>
      <div>
        {link.kind === "none" ? (
          <Button onClick={onPairFirst}>{agentCopy["pair.title"]}</Button>
        ) : (
          <Button pending={starting} onClick={() => pairNew()}>
            {homeCopy.pairNew}
          </Button>
        )}
      </div>
    </>
  );
}
