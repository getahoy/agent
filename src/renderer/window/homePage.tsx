import { agentCopy, helperStatusCopy } from "../../copy/agentCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import type { PairingStatus } from "../../core/pairing/pairingStatus.ts";
import { Text } from "../components/ui/text.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { LastHeard } from "../phone/lastHeard.tsx";
import { type PhoneLink, phoneLink } from "../phone/phoneLink.ts";
import { EndedNotice } from "./endedNotice.tsx";
import { HomePairing } from "./homePairing.tsx";
import { PhoneStatusCard } from "./phoneStatusCard.tsx";

function homeTitle(link: PhoneLink, pairing: PairingStatus): string {
  if (link.kind === "none" || pairing.kind === "paired") {
    return agentCopy["pair.title"];
  }
  const name = link.phone.displayName;
  if (link.kind === "connected") {
    return `${agentCopy["menubar.connectedTo"]} ${name}`;
  }
  return name;
}

type HomePageProps = { state: AgentState };

export function HomePage({ state }: HomePageProps) {
  const actions = useAgentActions();
  const link = phoneLink(state);
  const pairing = link.kind === "none" || state.pairing.kind === "paired";
  return (
    <>
      <Text as="h1" variant="title">
        {homeTitle(link, state.pairing)}
      </Text>
      {state.endedNotice ? (
        <EndedNotice
          notice={state.endedNotice}
          onDismiss={() => void actions.dismissNotice()}
        />
      ) : null}
      {link.kind === "none" || pairing ? (
        <HomePairing status={state.pairing} />
      ) : (
        <PhoneStatusCard kind={link.kind} phone={link.phone} />
      )}
      {state.lastHeard && !pairing ? (
        <LastHeard heard={state.lastHeard} size="window" />
      ) : null}
      <p aria-live="polite" className="mt-auto text-caption text-fog">
        {helperStatusCopy[state.helper]}
      </p>
    </>
  );
}
