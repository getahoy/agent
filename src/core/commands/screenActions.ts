import type { Intent } from "./intent.ts";

// input: keys, clicks or scrolling reach the front app, so a blocked app refuses them.
// window: the front window is moved. tab: a browser tab is closed. none: the screen is not touched.
export type ScreenReach = "input" | "window" | "tab" | "none";

export function screenReach(intent: Intent): ScreenReach {
  switch (intent.kind) {
    case "click":
    case "keys":
    case "type":
    case "scroll":
    case "navigate":
      return "input";
    case "window":
      return "window";
    case "closeTab":
      return "tab";
    case "open":
    case "quit":
    case "hide":
    case "activate":
    case "search":
    case "openSite":
    case "switchTab":
    case "draftEmail":
    case "media":
    case "volume":
    case "brightness":
    case "lock":
    case "again":
      return "none";
    default: {
      const unhandled: never = intent;
      throw new Error(`Unhandled intent ${JSON.stringify(unhandled)}`);
    }
  }
}

// These act on whatever is in front, so a late answer must find the same window there.
export function actsOnScreen(intent: Intent): boolean {
  return screenReach(intent) !== "none";
}
