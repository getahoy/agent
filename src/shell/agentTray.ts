import {
  Menu,
  type MenuItemConstructorOptions,
  type NativeImage,
  type Rectangle,
  Tray,
} from "electron";
import { agentCopy } from "../copy/agentCopy.ts";
import { type AgentState, menubarStatus } from "../core/appState/appState.ts";
import type { MenubarStatus } from "../ports/platform.ts";

type TrayActions = {
  menubarIcon: (status: MenubarStatus) => NativeImage;
  togglePopover: (trayBounds: Rectangle) => void;
  openWindow: () => void;
  quit: () => void;
  extraMenuItems: readonly MenuItemConstructorOptions[];
};

const HEARD_TITLE_MS = 5000;
const HEARD_TITLE_CHARS = 40;

function clipped(text: string): string {
  if (text.length <= HEARD_TITLE_CHARS) return text;
  return `${text.slice(0, HEARD_TITLE_CHARS)}…`;
}

export class AgentTray {
  readonly #actions: TrayActions;
  readonly #tray: Tray;
  readonly #menu: Menu;
  #heardAt = 0;
  #heardTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(actions: TrayActions) {
    this.#actions = actions;
    this.#tray = new Tray(actions.menubarIcon("disconnected"));
    this.#tray.setToolTip(agentCopy["app.name"]);
    this.#tray.setIgnoreDoubleClickEvents(true);
    this.#menu = Menu.buildFromTemplate([
      { label: agentCopy["menubar.open"], click: actions.openWindow },
      ...actions.extraMenuItems,
      { type: "separator" },
      { label: agentCopy["menubar.quit"], click: actions.quit },
    ]);
    this.#tray.on("click", (_event, bounds) => actions.togglePopover(bounds));
    this.#tray.on("right-click", () => this.#tray.popUpContextMenu(this.#menu));
  }

  render(state: AgentState): void {
    this.#showHeard(state.lastHeard);
    this.#tray.setImage(this.#actions.menubarIcon(menubarStatus(state)));
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
