import path from "node:path";
import { pathToFileURL } from "node:url";
import type { BrowserWindow, WebPreferences } from "electron";
import type { RendererOrigin } from "../core/security/ownRenderer.ts";

export type Surface = "window" | "popover" | "gallery";

function rendererIndexPath(): string {
  return path.join(
    __dirname,
    `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`,
  );
}

export function rendererOrigin(): RendererOrigin {
  return {
    devServerUrl: MAIN_WINDOW_VITE_DEV_SERVER_URL || null,
    indexFileUrl: pathToFileURL(rendererIndexPath()).toString(),
  };
}

export function secureWebPreferences(): WebPreferences {
  return {
    preload: path.join(__dirname, "preload.cjs"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  };
}

export function loadSurface(window: BrowserWindow, surface: Surface): void {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const url = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    url.searchParams.set("surface", surface);
    void window.loadURL(url.toString());
    return;
  }
  void window.loadFile(rendererIndexPath(), { query: { surface } });
}
