import {
  Menu,
  type MenuItemConstructorOptions,
  type NativeImage,
  Tray,
} from "electron";
import { agentCopy, helperStatusCopy } from "../copy/agentCopy.ts";
import { type AgentState, menubarStatus } from "../core/appState/appState.ts";
import type { MenubarStatus } from "../ports/platform.ts";

type TrayActions = {
  menubarIcon: (status: MenubarStatus) => NativeImage;
  openWindow: () => void;
  setLanEnabled: (enabled: boolean) => void;
  quit: () => void;
};

function connectionLine(state: AgentState): string {
  if (state.screenLocked) return agentCopy["menubar.locked"];
  if (!state.lanEnabled) return agentCopy["menubar.off"];
  const [connected] = state.connectedPhones;
  if (connected) return `${agentCopy["menubar.connectedTo"]} ${connected}`;
  const [paired] = state.pairedPhones;
  if (paired) {
    return `${paired.displayName} ${agentCopy["menubar.notConnected"]}`;
  }
  return agentCopy["menubar.noPhone"];
}

function statusLines(state: AgentState): string[] {
  const lines = [connectionLine(state), helperStatusCopy[state.helper]];
  if (!state.permissions.accessibility) {
    lines.push(agentCopy["menubar.accessibilityNeeded"]);
  }
  if (!state.permissions.screenRecording) {
    lines.push(agentCopy["menubar.screenRecordingNeeded"]);
  }
  return lines;
}

export class AgentTray {
  readonly #actions: TrayActions;
  readonly #tray: Tray;

  constructor(actions: TrayActions) {
    this.#actions = actions;
    this.#tray = new Tray(actions.menubarIcon("disconnected"));
    this.#tray.setToolTip(agentCopy["app.name"]);
  }

  render(state: AgentState): void {
    const actions = this.#actions;
    this.#tray.setImage(actions.menubarIcon(menubarStatus(state)));
    const status: MenuItemConstructorOptions[] = statusLines(state).map(
      (label) => ({ label, enabled: false }),
    );
    this.#tray.setContextMenu(
      Menu.buildFromTemplate([
        ...status,
        { type: "separator" },
        {
          label: agentCopy["menubar.enabled"],
          type: "checkbox",
          checked: state.lanEnabled,
          click: (item) => actions.setLanEnabled(item.checked),
        },
        { type: "separator" },
        { label: agentCopy["menubar.open"], click: actions.openWindow },
        { label: agentCopy["menubar.quit"], click: actions.quit },
      ]),
    );
  }
}
