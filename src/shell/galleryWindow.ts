import { BrowserWindow } from "electron";
import { agentCopy } from "../copy/agentCopy.ts";
import { loadSurface, secureWebPreferences } from "./rendererSurface.ts";

const GALLERY_WIDTH = 1640;
const GALLERY_HEIGHT = 960;

export class GalleryWindow {
  #window: BrowserWindow | null = null;

  show(): void {
    const window = this.#window ?? this.#create();
    this.#window = window;
    window.show();
    window.focus();
  }

  #create(): BrowserWindow {
    const window = new BrowserWindow({
      width: GALLERY_WIDTH,
      height: GALLERY_HEIGHT,
      title: agentCopy["menubar.gallery"],
      webPreferences: secureWebPreferences(),
    });
    loadSurface(window, "gallery");
    window.on("closed", () => {
      this.#window = null;
    });
    return window;
  }
}
