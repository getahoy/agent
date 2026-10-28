import type { InterpretAction } from "@getahoy/protocol";
import { installedBrowser } from "./browsers.ts";
import { allowsEmailDraft } from "./emailRules.ts";
import type { Intent } from "./intent.ts";
import { allowsShortcut } from "./shortcutRules.ts";
import { isSiteHost } from "./siteHost.ts";

export type Validation =
  | { kind: "valid"; intents: Intent[] }
  | { kind: "rejected" };

type Context = { transcript: string; installedApps: readonly string[] };

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

function installedName(app: string, installedApps: readonly string[]) {
  const wanted = app.toLowerCase();
  return installedApps.find((installed) => installed.toLowerCase() === wanted);
}

function withBrowser<Action extends { browser: string | null }>(
  action: Action,
  installedApps: readonly string[],
): Action | null {
  if (action.browser === null) return action;
  const browser = installedBrowser(action.browser, installedApps);
  return browser ? { ...action, browser } : null;
}

function intentFor(action: InterpretAction, context: Context): Intent | null {
  const { transcript, installedApps } = context;
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
      return withBrowser(action, installedApps);
    case "openSite": {
      const host = action.host.toLowerCase();
      if (!isSiteHost(host)) return null;
      return withBrowser({ ...action, host }, installedApps);
    }
    case "keys":
      return allowsShortcut(action, transcript) ? action : null;
    case "type":
      return said(action.text, transcript) ? action : null;
    case "closeTab":
    case "switchTab":
      if (!said(action.match, transcript)) return null;
      return withBrowser(action, installedApps);
    case "draftEmail":
      if (!allowsEmailDraft(action, transcript)) return null;
      return withBrowser(action, installedApps);
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
): Validation {
  if (actions.length === 0 || !draftsAlone(actions)) {
    return { kind: "rejected" };
  }
  const intents: Intent[] = [];
  for (const action of actions) {
    const intent = intentFor(action, { transcript, installedApps });
    if (!intent) return { kind: "rejected" };
    intents.push(intent);
  }
  return { kind: "valid", intents };
}
