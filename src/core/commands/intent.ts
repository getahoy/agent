import type { EmailApp, KeyModifier, KeyName } from "@getahoy/protocol";

export type TabIntent = {
  kind: "closeTab" | "switchTab";
  match: string;
  browser: string | null;
};

export type EmailDraft = {
  kind: "draftEmail";
  to: string | null;
  subject: string;
  body: string;
  via: EmailApp;
  browser: string | null;
};

export type Intent =
  | { kind: "open"; app: string }
  | { kind: "quit"; app: string }
  | { kind: "hide"; app: string }
  | { kind: "activate"; app: string }
  | { kind: "search"; query: string; browser: string | null }
  | { kind: "openSite"; host: string; browser: string | null }
  | { kind: "keys"; key: KeyName; modifiers: readonly KeyModifier[] }
  | { kind: "type"; text: string }
  | { kind: "click"; label: string }
  | TabIntent
  | EmailDraft;

export type ParsedCommand =
  | { kind: "intent"; intent: Intent }
  | { kind: "ambiguous"; apps: readonly string[] }
  | { kind: "unknownApp"; name: string }
  | { kind: "unsupported" };
