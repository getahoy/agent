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

export class AgentTray {
  readonly #actions: TrayActions;
  readonly #tray: Tray;
  readonly #menu: Menu;

  constructor(actions: TrayActions) {
    this.#actions = actions;
    this.#tray = new Tray(actions.menubarIcon("noPhone"));
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
    this.#tray.setImage(this.#actions.menubarIcon(menubarStatus(state)));
  }
}
