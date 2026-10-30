import { BrowserWindow, nativeTheme } from "electron";
import { agentCopy } from "../copy/agentCopy.ts";
import type { LifecycleController } from "../ports/platform.ts";
import { loadSurface, secureWebPreferences } from "./surfaceUrl.ts";

const WINDOW_WIDTH = 760;
const WINDOW_HEIGHT = 540;
const TRAFFIC_LIGHTS = { x: 18, y: 18 };
const SAILCLOTH = "#f4f2ed";
const NIGHT = "#121110";

function canvasColor(): string {
  return nativeTheme.shouldUseDarkColors ? NIGHT : SAILCLOTH;
}

export class MainWindow {
  readonly #lifecycle: LifecycleController;
  readonly #onClosed: () => void;
  #window: BrowserWindow | null = null;

  constructor(lifecycle: LifecycleController, onClosed: () => void) {
    this.#lifecycle = lifecycle;
    this.#onClosed = onClosed;
    nativeTheme.on("updated", () =>
      this.#window?.setBackgroundColor(canvasColor()),
    );
  }

  close(): void {
    this.#window?.close();
  }

  show(): void {
    const window = this.#window ?? this.#create();
    this.#window = window;
    this.#lifecycle.showWindowSurface();
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  }

  #create(): BrowserWindow {
    const window = new BrowserWindow({
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      title: agentCopy["app.name"],
      titleBarStyle: "hiddenInset",
      trafficLightPosition: TRAFFIC_LIGHTS,
      backgroundColor: canvasColor(),
      resizable: false,
      fullscreenable: false,
      show: false,
      webPreferences: secureWebPreferences(),
    });
    loadSurface(window, "window");
    window.on("closed", () => {
      this.#window = null;
      this.#lifecycle.hideWindowSurface();
      this.#onClosed();
    });
    return window;
  }
}
