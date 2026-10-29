import type { Frame } from "./screenElement.ts";

export type Area = "toolbar" | "sidebar" | "bottom";

// ponytail: position only, an ancestor role walk in the helper if layouts mislead it.
const TOOLBAR_SHARE = 0.12;
const BOTTOM_SHARE = 0.2;
const SIDEBAR_SHARE = 0.25;

export function elementArea(frame: Frame, window: Frame): Area | null {
  const centerX = frame.x + frame.width / 2 - window.x;
  const centerY = frame.y + frame.height / 2 - window.y;
  if (centerY < window.height * TOOLBAR_SHARE) return "toolbar";
  if (centerY > window.height * (1 - BOTTOM_SHARE)) return "bottom";
  if (centerX < window.width * SIDEBAR_SHARE) return "sidebar";
  return null;
}
