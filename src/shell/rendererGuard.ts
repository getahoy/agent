import { app, type IpcMainInvokeEvent } from "electron";
import { isOwnRendererUrl } from "../core/security/ownRenderer.ts";
import { rendererOrigin } from "./rendererSurface.ts";

const origin = rendererOrigin();

export function isOwnRenderer(url: string): boolean {
  return isOwnRendererUrl(url, origin);
}

export function fromOwnRenderer(event: IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url;
  return url !== undefined && isOwnRenderer(url);
}

export function lockDownNavigation(): void {
  app.on("web-contents-created", (_event, contents) => {
    contents.setWindowOpenHandler(() => ({ action: "deny" }));
    contents.on("will-navigate", (navigation) => {
      if (!isOwnRenderer(navigation.url)) navigation.preventDefault();
    });
    contents.on("will-redirect", (redirect) => {
      if (!isOwnRenderer(redirect.url)) redirect.preventDefault();
    });
    contents.on("will-attach-webview", (attach) => attach.preventDefault());
  });
}
