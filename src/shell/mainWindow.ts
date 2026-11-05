import { BrowserWindow, nativeTheme } from "electron";
import { agentCopy } from "../copy/agentCopy.ts";
import type { LifecycleController } from "../ports/platform.ts";
import { loadSurface, secureWebPreferences } from "./rendererSurface.ts";

const WINDOW_WIDTH = 760;
const WINDOW_HEIGHT = 560;
const TRAFFIC_LIGHTS = { x: 18, y: 18 };
const SAILCLOTH = "#f4f2ed";
const NIGHT = "#121110";

function canvasColor(): string {
  return nativeTheme.shouldUseDarkColors ? NIGHT : SAILCLOTH;
}

export class MainWindow {
  readonly #lifecycle: LifecycleController;
  readonly #onVisibilityChange: () => void;
  readonly #onShown: () => void;
  #window: BrowserWindow | null = null;
  #visible = false;

  constructor(
    lifecycle: LifecycleController,
    onVisibilityChange: () => void,
    onShown: () => void,
  ) {
    this.#lifecycle = lifecycle;
    this.#onVisibilityChange = onVisibilityChange;
    this.#onShown = onShown;
    nativeTheme.on("updated", () =>
      this.#window?.setBackgroundColor(canvasColor()),
    );
  }

  close(): void {
    this.#window?.close();
  }

  isVisible(): boolean {
    return this.#visible;
  }

  show(): void {
    const window = this.#window ?? this.#create();
    this.#window = window;
    this.#lifecycle.showWindowSurface();
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
    this.#setVisible(true);
    this.#onShown();
  }

  #setVisible(visible: boolean): void {
    if (this.#visible === visible) return;
    this.#visible = visible;
    this.#onVisibilityChange();
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
    // macOS sends hide and show when the window is minimised, covered or on
    // another Space, not only when it is closed.
    window.on("show", () => this.#setVisible(true));
    window.on("restore", () => this.#setVisible(true));
    window.on("hide", () => this.#setVisible(false));
    window.on("minimize", () => this.#setVisible(false));
    window.on("closed", () => {
      this.#window = null;
      this.#lifecycle.hideWindowSurface();
      this.#setVisible(false);
    });
    return window;
  }
}
