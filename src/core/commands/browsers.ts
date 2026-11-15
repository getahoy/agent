import { matchApp } from "./matchApp.ts";

const CHROME = "Google Chrome";

const KNOWN_BROWSERS: readonly string[] = [
  "Safari",
  CHROME,
  "Arc",
  "Brave Browser",
  "Microsoft Edge",
  "Firefox",
  "Opera",
  "Vivaldi",
];

export type BrowserChoice =
  | { kind: "open"; browser: string | null }
  | { kind: "notInstalled"; browser: string };

// A browser set as the email app opens mailto links empty unless a web mail site registered
// itself, so a browser or an unknown handler gets Gmail compose instead.
export function draftOpensIn(
  mailtoHandler: string | null,
): "mailApp" | "gmail" {
  if (mailtoHandler === null) return "gmail";
  return KNOWN_BROWSERS.includes(mailtoHandler) ? "gmail" : "mailApp";
}

export function knownBrowser(spoken: string): string | null {
  const match = matchApp(spoken, KNOWN_BROWSERS);
  return match.kind === "one" ? match.app : null;
}

// A null browser lets macOS open the person's default browser.
export function chooseBrowser(
  named: string | null,
  installedApps: readonly string[],
): BrowserChoice {
  if (named) {
    return installedApps.includes(named)
      ? { kind: "open", browser: named }
      : { kind: "notInstalled", browser: named };
  }
  const chrome = installedApps.includes(CHROME) ? CHROME : null;
  return { kind: "open", browser: chrome };
}

export function tabSearchOrder(
  tabBrowsers: readonly string[],
  front: string | null,
): string[] {
  const preferred = front ? [front, CHROME] : [CHROME];
  const first = preferred.filter((browser) => tabBrowsers.includes(browser));
  return [...new Set([...first, ...tabBrowsers])];
}
