import type { InterpretAction } from "@getahoy/protocol";
import { knownBrowser } from "./browsers.ts";
import { draftFor } from "./emailDraft.ts";
import type { Intent, MacAction } from "./intent.ts";
import { allowsShortcut, isKeyName } from "./shortcutRules.ts";
import { isSiteHost } from "./siteHost.ts";
import { saidAsWritten } from "./spokenForm.ts";

export type Validation =
  | { kind: "valid"; intents: Intent[] }
  | { kind: "rejected" };

type Context = {
  transcript: string;
  installedApps: readonly string[];
  accountEmail: string | null;
};

const CLOSE_WORDS = /\b(?:close|shut|kill|remove|get rid of|band)\b/i;

function plainWords(text: string): string {
  return text
    .toLowerCase()
    .replace(/[!?,.;:"“”‘’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function said(words: string, transcript: string): boolean {
  return plainWords(transcript).includes(plainWords(words));
}

function typedAsSaid(text: string, transcript: string): boolean {
  return said(text, transcript) || saidAsWritten(text, transcript);
}

function installedName(app: string, installedApps: readonly string[]) {
  const wanted = app.toLowerCase();
  return installedApps.find((installed) => installed.toLowerCase() === wanted);
}

// A known browser that is not installed is kept, so the Mac can say so instead of refusing.
function withBrowser<Action extends { browser: string | null }>(
  action: Action,
): Action | null {
  if (action.browser === null) return action;
  const browser = knownBrowser(action.browser);
  return browser ? { ...action, browser } : null;
}

function shortcutIntent(
  { key, modifiers }: Extract<InterpretAction, { kind: "keys" }>,
  transcript: string,
): Intent | null {
  if (!isKeyName(key)) return null;
  const shortcut = { kind: "keys", key, modifiers } as const;
  return allowsShortcut(shortcut, transcript) ? shortcut : null;
}

// A level to set needs the level; up and down without a number take the usual step.
function macIntent(action: MacAction): Intent | null {
  const level = action.kind === "volume" || action.kind === "brightness";
  if (level && action.action === "set" && action.percent === null) return null;
  return action;
}

function intentFor(
  action: InterpretAction,
  { transcript, installedApps, accountEmail }: Context,
): Intent | null {
  switch (action.kind) {
    case "open":
    case "quit":
    case "hide":
    case "switch": {
      const app = installedName(action.app, installedApps);
      if (!app) return null;
      return { kind: action.kind === "switch" ? "activate" : action.kind, app };
    }
    case "search":
      return withBrowser(action);
    case "openSite": {
      const host = action.host.toLowerCase();
      if (!isSiteHost(host)) return null;
      return withBrowser({ ...action, host });
    }
    case "keys":
      return shortcutIntent(action, transcript);
    case "scroll":
    case "navigate":
    case "media":
    case "window":
    case "volume":
    case "brightness":
      return macIntent(action);
    case "type":
      return typedAsSaid(action.text, transcript) ? action : null;
    case "click":
      return said(action.label, transcript) ? action : null;
    case "closeTab":
      if (!CLOSE_WORDS.test(transcript)) return null;
      if (!said(action.match, transcript)) return null;
      return withBrowser(action);
    case "switchTab":
      if (!said(action.match, transcript)) return null;
      return withBrowser(action);
    case "draftEmail": {
      const context = { transcript, installedApps, accountEmail };
      return withBrowser(draftFor(action, context));
    }
    default: {
      const unhandled: never = action;
      throw new Error(`Unhandled action ${JSON.stringify(unhandled)}`);
    }
  }
}

// A draft must stay a draft: nothing may follow it that could press Send.
function draftsAlone(actions: readonly InterpretAction[]): boolean {
  const drafts = actions.some((action) => action.kind === "draftEmail");
  return !drafts || actions.length === 1;
}

export function validateActions(
  actions: readonly InterpretAction[],
  transcript: string,
  installedApps: readonly string[],
  accountEmail: string | null = null,
): Validation {
  if (actions.length === 0 || !draftsAlone(actions)) {
    return { kind: "rejected" };
  }
  const context = { transcript, installedApps, accountEmail };
  const intents: Intent[] = [];
  for (const action of actions) {
    const intent = intentFor(action, context);
    if (!intent) return { kind: "rejected" };
    intents.push(intent);
  }
  return { kind: "valid", intents };
}
