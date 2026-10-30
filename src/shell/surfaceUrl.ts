import path from "node:path";
import type { BrowserWindow, WebPreferences } from "electron";

export type Surface = "window" | "popover" | "gallery";

export function secureWebPreferences(): WebPreferences {
  return {
    preload: path.join(__dirname, "preload.cjs"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  };
}

export function loadSurface(window: BrowserWindow, surface: Surface): void {
  const query = { surface };
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const url = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    url.searchParams.set("surface", surface);
    void window.loadURL(url.toString());
    return;
  }
  void window.loadFile(
    path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    { query },
  );
}
