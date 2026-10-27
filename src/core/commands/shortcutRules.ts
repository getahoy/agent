import type { KeyModifier, KeyName } from "@getahoy/protocol";
import { NAMED_KEYS } from "@getahoy/protocol";

const RETURN_WORDS = /\b(?:enter|send|submit|return)\b/i;
const DELETE_KEYS: readonly string[] = ["delete", "forwardDelete"];
const QUIT_KEY: KeyName = "q";
const FORCE_QUIT_KEY: KeyName = "escape";
const SYSTEM_KEYS: readonly string[] = ["power", "eject"];

export type Shortcut = { key: KeyName; modifiers: readonly KeyModifier[] };

type AnyShortcut = { key: string; modifiers: readonly KeyModifier[] };

function isNamedKey(key: KeyName): boolean {
  return NAMED_KEYS.some((named) => named === key);
}

// Power and eject are not in the key list today; this keeps them blocked if they are added.
export function isBlockedShortcut({ key, modifiers }: AnyShortcut): boolean {
  if (SYSTEM_KEYS.includes(key)) return true;
  if (!modifiers.includes("mod")) return false;
  if (key === QUIT_KEY || DELETE_KEYS.includes(key)) return true;
  return key === FORCE_QUIT_KEY && modifiers.includes("alt");
}

function isPlainTyping({ key, modifiers }: Shortcut): boolean {
  if (isNamedKey(key)) return false;
  return modifiers.every((modifier) => modifier === "shift");
}

export function allowsShortcut(
  shortcut: Shortcut,
  transcript: string,
): boolean {
  if (isBlockedShortcut(shortcut) || isPlainTyping(shortcut)) return false;
  return shortcut.key !== "return" || RETURN_WORDS.test(transcript);
}
