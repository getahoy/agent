import type { MacAction, ParsedCommand, Refusal } from "./intent.ts";

type LevelKind = "volume" | "brightness";
type Change = { action: "up" | "down" | "set"; percent: number | null };

const LITTLE_STEP = 5;
const LOT_STEP = 25;
const FULL = 100;
const HALF = 50;
const TENTHS = 10;

const NOUNS: Readonly<Record<LevelKind, string>> = {
  volume: "(?:the )?(?:volume|sound)",
  brightness: "(?:the )?(?:brightness|screen)",
};
const LITTLE = /^(?:a little|a bit|slightly)$/;
const LOT = /^(?:a lot|way|much)$/;
const NUMBER = /^(?:by )?(\d+)(?: ?%| percent)?$/;
const OUT_OF_TEN = /^(\d+) out of 10$/;
const TOP_WORDS = /^(?:full|max|maximum|all the way up)$/;
const BOTTOM_WORDS = /^(?:lowest|minimum|zero|all the way down)$/;
const KEYBOARD_LIGHT = /\bkeyboard (?:light|backlight|brightness)\b/;
const EXTERNAL_SCREEN = /\b(?:external|other) (?:display|monitor|screen)\b/;
const LEVEL_WORDS = /\b(?:brightness|bright|brighter|dim|dimmer)\b/;
const ONE_APP = /^(?:turn (?:up |down )?|set )?(?:the )?(.+?) volume\b/;
const MUTE = /^(mute|unmute)(?: (?:the )?(?:sound|volume|audio|it|mac))?$/;
const TOO = /^(?:it(?:'| )?s |it is )?too (loud|quiet)$/;
const BARE_STEP = /^(up|down) (?:by )?(\d+)(?: ?%| percent)?$/;
const SHADES = /^(?:make it |make the screen )?(?:(.+) )?(brighter|dimmer)$/;
const HINDI_VOLUME: Readonly<Record<string, "up" | "down">> = {
  "awaaz badhao": "up",
  "awaaz kam karo": "down",
};

function step(rest: string | undefined): number | null | undefined {
  if (rest === undefined) return null;
  if (LITTLE.test(rest)) return LITTLE_STEP;
  if (LOT.test(rest)) return LOT_STEP;
  const number = NUMBER.exec(rest)?.[1];
  return number === undefined ? undefined : Number(number);
}

function level(words: string): number | undefined {
  if (words === "half") return HALF;
  if (TOP_WORDS.test(words)) return FULL;
  if (BOTTOM_WORDS.test(words)) return 0;
  const tenths = OUT_OF_TEN.exec(words)?.[1];
  if (tenths !== undefined) return Number(tenths) * TENTHS;
  const number = NUMBER.exec(words)?.[1];
  return number === undefined ? undefined : Number(number);
}

function subjectOf(kind: LevelKind): string {
  return kind === "volume" ? `(?:it|${NOUNS.volume})` : NOUNS.brightness;
}

function relative(kind: LevelKind, command: string): Change | null {
  const noun = NOUNS[kind];
  const patterns = [
    new RegExp(`^${noun} (up|down)(?: (.+))?$`),
    new RegExp(`^turn ${subjectOf(kind)} (up|down)(?: (.+))?$`),
    new RegExp(`^turn (up|down) ${noun}(?: (.+))?$`),
  ];
  for (const pattern of patterns) {
    const [, direction, rest] = pattern.exec(command) ?? [];
    if (direction !== "up" && direction !== "down") continue;
    const percent = step(rest);
    if (percent !== undefined) return { action: direction, percent };
  }
  return null;
}

function absolute(kind: LevelKind, command: string): Change | null {
  const noun = NOUNS[kind];
  const patterns = [
    new RegExp(`^(?:set )?${noun} (?:to |at )?(.+)$`),
    new RegExp(`^(.+) ${noun}$`),
    new RegExp(`^turn ${subjectOf(kind)} (all the way (?:up|down))$`),
  ];
  for (const pattern of patterns) {
    const words = pattern.exec(command)?.[1];
    const percent = words === undefined ? undefined : level(words);
    if (percent !== undefined) return { action: "set", percent };
  }
  return null;
}

function volumeOnly(command: string): MacAction | null {
  const sound = MUTE.exec(command)?.[1];
  if (sound === "mute" || sound === "unmute") {
    return { kind: "volume", action: sound, percent: null };
  }
  const too = TOO.exec(command)?.[1];
  if (too) {
    const action = too === "loud" ? "down" : "up";
    return { kind: "volume", action, percent: null };
  }
  const [, direction, number] = BARE_STEP.exec(command) ?? [];
  if (direction === "up" || direction === "down") {
    return { kind: "volume", action: direction, percent: Number(number) };
  }
  const hindi = HINDI_VOLUME[command];
  return hindi ? { kind: "volume", action: hindi, percent: null } : null;
}

function shades(command: string): MacAction | null {
  const [, rest, word] = SHADES.exec(command) ?? [];
  if (!word) return null;
  const percent = step(rest);
  if (percent === undefined) return null;
  const action = word === "brighter" ? "up" : "down";
  return { kind: "brightness", action, percent };
}

function refusal(command: string, apps: readonly string[]): Refusal | null {
  if (KEYBOARD_LIGHT.test(command)) return "keyboardLight";
  if (EXTERNAL_SCREEN.test(command) && LEVEL_WORDS.test(command)) {
    return "externalDisplay";
  }
  const named = ONE_APP.exec(command)?.[1];
  const oneApp = apps.some((app) => app.toLowerCase() === named);
  return oneApp ? "oneAppVolume" : null;
}

export function parseLevelCommand(
  command: string,
  installedApps: readonly string[],
): ParsedCommand | null {
  const reason = refusal(command, installedApps);
  if (reason) return { kind: "refuse", reason };
  const fixed = volumeOnly(command) ?? shades(command);
  if (fixed) return { kind: "intent", intent: fixed };
  for (const kind of ["volume", "brightness"] as const) {
    const change = relative(kind, command) ?? absolute(kind, command);
    if (change) return { kind: "intent", intent: { kind, ...change } };
  }
  return null;
}
