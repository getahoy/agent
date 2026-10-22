import path from "node:path";
import { BrowserWindow } from "electron";
import { agentCopy } from "../copy/agentCopy.ts";
import type { LifecycleController } from "../ports/platform.ts";

const WINDOW_WIDTH = 520;
const WINDOW_HEIGHT = 560;

export class MainWindow {
  readonly #lifecycle: LifecycleController;
  #window: BrowserWindow | null = null;

  constructor(lifecycle: LifecycleController) {
    this.#lifecycle = lifecycle;
  }

  show(): void {
    const window = this.#window ?? this.#create();
    this.#window = window;
    this.#lifecycle.showWindowSurface();
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  }

  send(channel: string, payload: unknown): void {
    this.#window?.webContents.send(channel, payload);
  }

  #create(): BrowserWindow {
    const window = new BrowserWindow({
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      title: agentCopy["app.name"],
      resizable: false,
      show: false,
      webPreferences: { preload: path.join(__dirname, "preload.cjs") },
    });
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      void window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      void window.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      );
    }
    window.on("closed", () => {
      this.#window = null;
      this.#lifecycle.hideWindowSurface();
    });
    return window;
  }
}
