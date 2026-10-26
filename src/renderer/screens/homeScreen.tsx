import { homeCopy } from "../../copy/homeCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import { AccountFooter } from "../components/accountFooter.tsx";
import { EndedNoticeBanner } from "../components/endedNoticeBanner.tsx";
import { PairedHome } from "../components/pairedHome.tsx";
import { ScreenLayout } from "../components/screenLayout.tsx";
import { UnpairedHome } from "../components/unpairedHome.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";

type HomeScreenProps = { state: AgentState };

export function HomeScreen({ state }: HomeScreenProps) {
  const actions = useAgentActions();
  const [phone] = state.pairedPhones;
  const showPhone = phone !== undefined && state.pairing.kind !== "paired";

  return (
    <ScreenLayout
      title={phone ? homeCopy.title : homeCopy.noPhoneTitle}
      helper={state.helper}
    >
      {state.endedNotice ? (
        <EndedNoticeBanner
          notice={state.endedNotice}
          onDismiss={() => void actions.dismissNotice()}
        />
      ) : null}
      {showPhone ? (
        <PairedHome state={state} phone={phone} />
      ) : (
        <UnpairedHome state={state} />
      )}
      {phone ? (
        <AccountFooter
          email={phone.accountEmail}
          onSignOut={() => void actions.signOut()}
        />
      ) : null}
    </ScreenLayout>
  );
}
