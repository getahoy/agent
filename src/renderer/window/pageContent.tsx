import type { AgentState } from "../../core/appState/appState.ts";
import { PermissionList } from "../permissions/permissionList.tsx";
import { PermissionsTitle } from "../permissions/permissionsTitle.tsx";
import { AccountPage } from "./accountPage.tsx";
import { HomePage } from "./homePage.tsx";
import { PhonePage } from "./phonePage.tsx";
import { SettingsPage } from "./settingsPage.tsx";
import type { WindowPage } from "./windowPage.ts";

type PageContentProps = {
  page: WindowPage;
  state: AgentState;
  onNavigate: (page: WindowPage) => void;
};

export function PageContent({ page, state, onNavigate }: PageContentProps) {
  switch (page) {
    case "home":
      return <HomePage state={state} />;
    case "phone":
      return <PhonePage state={state} onPairFirst={() => onNavigate("home")} />;
    case "permissions":
      return (
        <>
          <PermissionsTitle variant="title" />
          <PermissionList permissions={state.permissions} layout="page" />
        </>
      );
    case "settings":
      return <SettingsPage lanEnabled={state.lanEnabled} />;
    case "account":
      return <AccountPage phone={state.pairedPhones[0]} />;
    default: {
      const unhandled: never = page;
      return unhandled;
    }
  }
}
