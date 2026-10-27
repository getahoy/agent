import { homeCopy } from "../../copy/homeCopy.ts";
import type { AgentState, PhoneSummary } from "../../core/appState/appState.ts";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { ActionButton } from "./actionButton.tsx";
import { HeardBanner } from "./heardBanner.tsx";
import { PhoneStatusCard } from "./phoneStatusCard.tsx";

type PairedHomeProps = { state: AgentState; phone: PhoneSummary };

export function PairedHome({ state, phone }: PairedHomeProps) {
  const actions = useAgentActions();
  const toggleLabel = state.lanEnabled ? homeCopy.turnOff : homeCopy.turnOn;
  return (
    <>
      <PhoneStatusCard state={state} phone={phone} />
      {state.lastHeard ? <HeardBanner text={state.lastHeard.text} /> : null}
      <div className="flex flex-wrap gap-2">
        <ActionButton
          tone="plain"
          onPress={() => void actions.setLanEnabled(!state.lanEnabled)}
        >
          {toggleLabel}
        </ActionButton>
        <ActionButton
          tone="plain"
          onPress={() => void actions.unpairPhone(phone.publicKey)}
        >
          {homeCopy.remove}
        </ActionButton>
        <ActionButton
          tone="plain"
          onPress={() => void actions.requestNewPhone()}
        >
          {homeCopy.pairNew}
        </ActionButton>
      </div>
    </>
  );
}
