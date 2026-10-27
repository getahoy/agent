import type { Intent, ParsedCommand } from "./intent.ts";
import { matchApp } from "./matchApp.ts";

type AppVerb = Extract<Intent, { app: string }>["kind"];

const FILLER_PREFIXES = [
  "hey ahoy ",
  "ahoy ",
  "please ",
  "can you ",
  "could you ",
];
const HINGLISH_ENDINGS: readonly [string, string][] = [
  [" open karo", "open"],
  [" chalu karo", "open"],
  [" kholo", "open"],
  [" band karo", "close"],
];
const SEARCH = /^(?:search for|search|google) (.+)$/;
const SITE = /^open ((?:[a-z0-9-]+\.)+(?:com|in|org|net|io|dev|ai))$/;
const APP_VERBS: readonly [RegExp, AppVerb][] = [
  [/^(?:open|launch|start) (.+)$/, "open"],
  [/^(?:close|quit) (.+)$/, "quit"],
  [/^hide (.+)$/, "hide"],
  [/^(?:switch to|go to) (.+)$/, "activate"],
];

const POLITE_SUFFIX = " please";

function stripFillers(text: string): string {
  const polite = text.endsWith(POLITE_SUFFIX);
  const rest = polite ? text.slice(0, -POLITE_SUFFIX.length) : text;
  const prefix = FILLER_PREFIXES.find((filler) => rest.startsWith(filler));
  return prefix ? stripFillers(rest.slice(prefix.length)) : rest;
}

function fromHinglish(text: string): string {
  for (const [ending, verb] of HINGLISH_ENDINGS) {
    if (!text.endsWith(ending)) continue;
    return `${verb} ${text.slice(0, -ending.length)}`;
  }
  return text;
}

export function normaliseCommand(text: string): string {
  const spaced = text
    .toLowerCase()
    .replace(/[!?,;:"“”‘’]/g, " ")
    .replace(/\.(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return fromHinglish(stripFillers(spaced));
}

function appName(spoken: string): string {
  return spoken.replace(/^the /, "").replace(/ app$/, "");
}

function appIntent(
  verb: AppVerb,
  spoken: string,
  installedApps: readonly string[],
): ParsedCommand {
  const name = appName(spoken);
  const match = matchApp(name, installedApps);
  if (match.kind === "many") return { kind: "ambiguous", apps: match.apps };
  if (match.kind === "none") return { kind: "unknownApp", name };
  return { kind: "intent", intent: { kind: verb, app: match.app } };
}

export function parseCommand(
  text: string,
  installedApps: readonly string[],
): ParsedCommand {
  const command = normaliseCommand(text);
  const query = SEARCH.exec(command)?.[1];
  if (query) return { kind: "intent", intent: { kind: "search", query } };
  const host = SITE.exec(command)?.[1];
  if (host) return { kind: "intent", intent: { kind: "openSite", host } };
  for (const [pattern, verb] of APP_VERBS) {
    const spoken = pattern.exec(command)?.[1];
    if (spoken) return appIntent(verb, spoken, installedApps);
  }
  return { kind: "unsupported" };
}
