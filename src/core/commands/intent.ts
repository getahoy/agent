export type Intent =
  | { kind: "open"; app: string }
  | { kind: "quit"; app: string }
  | { kind: "hide"; app: string }
  | { kind: "activate"; app: string }
  | { kind: "search"; query: string }
  | { kind: "openSite"; host: string };

export type ParsedCommand =
  | { kind: "intent"; intent: Intent }
  | { kind: "ambiguous"; apps: readonly string[] }
  | { kind: "unknownApp"; name: string }
  | { kind: "unsupported" };
