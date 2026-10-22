import {
  Menu,
  type MenuItemConstructorOptions,
  nativeImage,
  Tray,
} from "electron";
import { agentCopy, helperStatusCopy } from "../copy/agentCopy.ts";
import type { AgentState } from "../core/appState/appState.ts";

type TrayActions = {
  openWindow: () => void;
  quit: () => void;
};

function statusLines(state: AgentState): string[] {
  const lines = [
    state.screenLocked
      ? agentCopy["menubar.locked"]
      : agentCopy["menubar.disconnected"],
    helperStatusCopy[state.helper],
  ];
  if (!state.permissions.accessibility) {
    lines.push(agentCopy["menubar.accessibilityNeeded"]);
  }
  if (!state.permissions.screenRecording) {
    lines.push(agentCopy["menubar.screenRecordingNeeded"]);
  }
  return lines;
}

export class AgentTray {
  readonly #tray = new Tray(nativeImage.createEmpty());
  readonly #actions: TrayActions;

  constructor(actions: TrayActions) {
    this.#actions = actions;
    this.#tray.setTitle(agentCopy["app.name"]);
  }

  render(state: AgentState): void {
    const status: MenuItemConstructorOptions[] = statusLines(state).map(
      (label) => ({ label, enabled: false }),
    );
    this.#tray.setContextMenu(
      Menu.buildFromTemplate([
        ...status,
        { type: "separator" },
        { label: agentCopy["menubar.open"], click: this.#actions.openWindow },
        { label: agentCopy["menubar.quit"], click: this.#actions.quit },
      ]),
    );
  }
}
