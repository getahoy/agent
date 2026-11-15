import type {
  EmailApp,
  InterpretAction,
  KeyModifier,
  KeyName,
} from "@getahoy/protocol";

export type TabIntent = {
  kind: "closeTab" | "switchTab";
  match: string;
  browser: string | null;
};

export type MailApp = { name: string; installed: boolean };

export type EmailDraft = {
  kind: "draftEmail";
  to: string | null;
  recipient: "exact" | "close" | "self" | "none";
  mailApp: MailApp | null;
  sending: boolean;
  subject: string;
  body: string;
  via: EmailApp;
  browser: string | null;
};

export type MacAction = Extract<
  InterpretAction,
  { kind: "scroll" | "navigate" | "media" | "volume" | "brightness" | "window" }
>;

export type StepScale = "small" | "normal" | "large";

export type AgainIntent = {
  kind: "again";
  amount: StepScale;
  toward: "up" | "down" | null;
};

export type RunnableIntent =
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
  | EmailDraft
  | MacAction
  | { kind: "lock" };

export type Intent = RunnableIntent | AgainIntent;

export type Refusal =
  | "oneAppVolume"
  | "keyboardLight"
  | "externalDisplay"
  | "autoScroll";

export type ParsedCommand =
  | { kind: "intent"; intent: Intent }
  | { kind: "ambiguous"; apps: readonly string[] }
  | { kind: "unknownApp"; name: string }
  | { kind: "refuse"; reason: Refusal }
  | { kind: "unsupported" };
