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
  const [phone] = state.pairedPhones;
  if (!phone) return agentCopy["menubar.noPhone"];
  const name = phone.displayName;
  if (state.connectedPhoneKeys.includes(phone.publicKey)) {
    return `${agentCopy["menubar.connectedTo"]} ${name}`;
  }
  if (state.pausedPhoneKeys.includes(phone.publicKey)) {
    return `${name} ${agentCopy["menubar.paused"]}`;
  }
  return `${name} ${agentCopy["menubar.ready"]}`;
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

const HEARD_TITLE_MS = 5000;
const HEARD_TITLE_CHARS = 40;

function clipped(text: string): string {
  if (text.length <= HEARD_TITLE_CHARS) return text;
  return `${text.slice(0, HEARD_TITLE_CHARS)}…`;
}

export class AgentTray {
  readonly #actions: TrayActions;
  readonly #tray: Tray;
  #heardAt = 0;
  #heardTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(actions: TrayActions) {
    this.#actions = actions;
    this.#tray = new Tray(actions.menubarIcon("disconnected"));
    this.#tray.setToolTip(agentCopy["app.name"]);
  }

  render(state: AgentState): void {
    this.#showHeard(state.lastHeard);
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

  #showHeard(heard: AgentState["lastHeard"]): void {
    if (!heard || heard.at === this.#heardAt) return;
    this.#heardAt = heard.at;
    this.#tray.setTitle(` “${clipped(heard.text)}”`);
    if (this.#heardTimer) clearTimeout(this.#heardTimer);
    const clear = () => this.#tray.setTitle("");
    this.#heardTimer = setTimeout(clear, HEARD_TITLE_MS);
  }
}
