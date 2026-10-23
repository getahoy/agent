import type { Modifier } from "../core/helper/helperProtocol.ts";

const modifierAliases: Record<string, Modifier> = {
  mod: "command",
  cmd: "command",
  command: "command",
  shift: "shift",
  opt: "option",
  option: "option",
  alt: "option",
  ctrl: "control",
  control: "control",
};

type KeyCombo = { key: string; modifiers: Modifier[] };

export function parseKeyCombo(text: string): KeyCombo | null {
  const parts = text.split("+").filter((part) => part.length > 0);
  const key = parts.pop();
  if (!key) return null;
  const modifiers: Modifier[] = [];
  for (const part of parts) {
    const modifier = modifierAliases[part.toLowerCase()];
    if (!modifier) return null;
    modifiers.push(modifier);
  }
  return { key, modifiers };
}
