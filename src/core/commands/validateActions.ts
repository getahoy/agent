import type { InterpretAction } from "@getahoy/protocol";
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

function tabIntent(
  action: Extract<InterpretAction, { kind: "closeTab" | "switchTab" }>,
  { transcript, installedApps }: Context,
): Intent | null {
  if (!said(action.match, transcript)) return null;
  if (action.browser === null) return { ...action, browser: null };
  const browser = installedName(action.browser, installedApps);
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
      return action;
    case "openSite": {
      const host = action.host.toLowerCase();
      return isSiteHost(host) ? { kind: "openSite", host } : null;
    }
    case "keys":
      return allowsShortcut(action, transcript) ? action : null;
    case "type":
      return said(action.text, transcript) ? action : null;
    case "closeTab":
    case "switchTab":
      return tabIntent(action, context);
    case "draftEmail":
      return allowsEmailDraft(action, transcript) ? action : null;
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
