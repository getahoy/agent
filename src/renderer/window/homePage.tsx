import { useEffect } from "react";
import { agentCopy, helperStatusCopy } from "../../copy/agentCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import type { PairingStatus } from "../../core/pairing/pairingStatus.ts";
import { Text } from "../components/ui/text.tsx";
import { EndedMessage } from "../pairing/endedMessage.tsx";
import { PairingPanel } from "../pairing/pairingPanel.tsx";
import { shownEndedNotice } from "../pairing/shownEndedNotice.ts";
import { LastHeard } from "../phone/lastHeard.tsx";
import { type PhoneLink, phoneLink } from "../phone/phoneLink.ts";
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
  const link = phoneLink(state);
  const pairing = link.kind === "none" || state.pairing.kind === "paired";
  const ended = shownEndedNotice(state);
  useEffect(() => {
    const phones = state.pairedPhones.length;
    const shown = ended ? "shown" : "null";
    window.ahoy.devLog(
      "home",
      `render: ${phones} phones, pairing ${state.pairing.kind}, notice ${shown}`,
    );
  });
  return (
    <>
      {ended ? (
        <EndedMessage notice={ended} place="home" />
      ) : (
        <Text as="h1" variant="title">
          {homeTitle(link, state.pairing)}
        </Text>
      )}
      {pairing ? (
        <PairingPanel status={state.pairing} place={ended ? "ended" : "home"} />
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
