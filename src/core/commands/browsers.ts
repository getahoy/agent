import { matchApp } from "./matchApp.ts";

const KNOWN_BROWSERS: readonly string[] = [
  "Safari",
  "Google Chrome",
  "Arc",
  "Brave Browser",
  "Microsoft Edge",
  "Firefox",
  "Opera",
  "Vivaldi",
];

export function installedBrowser(
  spoken: string,
  installedApps: readonly string[],
): string | null {
  const browsers = installedApps.filter((app) => KNOWN_BROWSERS.includes(app));
  const match = matchApp(spoken, browsers);
  return match.kind === "one" ? match.app : null;
}
