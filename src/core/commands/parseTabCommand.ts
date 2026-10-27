import type { ParsedCommand, TabIntent } from "./intent.ts";
import { matchApp } from "./matchApp.ts";

const NEW_TAB = /^(?:open )?(?:a )?new tab$/;
const CURRENT_TAB = /^close (?:this |the current |current |the )?tab$/;
const CLOSE_TAB = /^close (?:the |my )?(.+?) tab(?: in (.+))?$/;
const SWITCH_TAB = /^(?:go to|switch to) (?:the |my )?(.+?) tab(?: in (.+))?$/;
const CURRENT_WORDS: readonly string[] = [
  "this",
  "that",
  "current",
  "the current",
];

const shortcut = (key: "t" | "w"): ParsedCommand => ({
  kind: "intent",
  intent: { kind: "keys", key, modifiers: ["mod"] },
});

function tabCommand(
  kind: TabIntent["kind"],
  [, match = "", spokenBrowser]: RegExpExecArray,
  installedApps: readonly string[],
): ParsedCommand {
  if (kind === "closeTab" && CURRENT_WORDS.includes(match)) {
    return shortcut("w");
  }
  if (!spokenBrowser) {
    return { kind: "intent", intent: { kind, match, browser: null } };
  }
  const browser = matchApp(spokenBrowser, installedApps);
  if (browser.kind === "many") return { kind: "ambiguous", apps: browser.apps };
  if (browser.kind === "none") {
    return { kind: "unknownApp", name: spokenBrowser };
  }
  return { kind: "intent", intent: { kind, match, browser: browser.app } };
}

export function parseTabCommand(
  command: string,
  installedApps: readonly string[],
): ParsedCommand | null {
  if (NEW_TAB.test(command)) return shortcut("t");
  if (CURRENT_TAB.test(command)) return shortcut("w");
  const closing = CLOSE_TAB.exec(command);
  if (closing) return tabCommand("closeTab", closing, installedApps);
  const switching = SWITCH_TAB.exec(command);
  if (switching) return tabCommand("switchTab", switching, installedApps);
  return null;
}
