import { BrowserWindow, type Rectangle, screen } from "electron";
import { loadSurface, secureWebPreferences } from "./surfaceUrl.ts";

const POPOVER_WIDTH = 340;
const POPOVER_START_HEIGHT = 320;
const POPOVER_MAX_HEIGHT = 640;
const GAP_BELOW_TRAY = 4;
const SCREEN_MARGIN = 8;
const REOPEN_GUARD_MS = 250;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export class PopoverWindow {
  readonly #window: BrowserWindow;
  #hiddenAt = 0;

  constructor() {
    this.#window = new BrowserWindow({
      width: POPOVER_WIDTH,
      height: POPOVER_START_HEIGHT,
      show: false,
      frame: false,
      transparent: true,
      vibrancy: "popover",
      visualEffectState: "active",
      roundedCorners: true,
      hasShadow: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      webPreferences: secureWebPreferences(),
    });
    this.#window.setHiddenInMissionControl(true);
    this.#window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.#window.on("blur", () => this.hide());
    this.#window.webContents.on("before-input-event", (event, input) => {
      if (input.type !== "keyDown" || input.key !== "Escape") return;
      event.preventDefault();
      this.hide();
    });
    loadSurface(this.#window, "popover");
  }

  toggle(trayBounds: Rectangle): void {
    if (this.#window.isVisible()) {
      this.hide();
      return;
    }
    // A click on the tray icon blurs the open popover first, so the same
    // click must not reopen it.
    if (Date.now() - this.#hiddenAt < REOPEN_GUARD_MS) return;
    this.#show(trayBounds);
  }

  hide(): void {
    if (!this.#window.isVisible()) return;
    this.#hiddenAt = Date.now();
    this.#window.setAlwaysOnTop(false);
    this.#window.hide();
  }

  setHeight(height: number): void {
    const bounded = clamp(Math.ceil(height), 1, POPOVER_MAX_HEIGHT);
    this.#window.setSize(POPOVER_WIDTH, bounded);
  }

  #show(trayBounds: Rectangle): void {
    const { workArea } = screen.getDisplayMatching(trayBounds);
    const centred = trayBounds.x + trayBounds.width / 2 - POPOVER_WIDTH / 2;
    const x = clamp(
      Math.round(centred),
      workArea.x + SCREEN_MARGIN,
      workArea.x + workArea.width - POPOVER_WIDTH - SCREEN_MARGIN,
    );
    const y = Math.max(trayBounds.y + trayBounds.height, workArea.y);
    this.#window.setPosition(x, y + GAP_BELOW_TRAY);
    this.#window.setAlwaysOnTop(true, "pop-up-menu");
    this.#window.show();
    this.#window.focus();
  }
}
