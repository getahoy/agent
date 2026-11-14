import type { KeyName } from "@getahoy/protocol";
import type { ParsedCommand } from "./intent.ts";

const CLICK = /^(?:click|press|tap)(?: on)? (?:the )?(.+?)(?: button| link)?$/;

const PRESSED_KEYS: Readonly<Record<string, KeyName>> = {
  enter: "return",
  return: "return",
  escape: "escape",
  esc: "escape",
  tab: "tab",
  space: "space",
  delete: "delete",
  backspace: "delete",
  up: "up",
  down: "down",
  left: "left",
  right: "right",
  "page up": "pageUp",
  "page down": "pageDown",
};

function clickOrKey(verb: string, label: string): ParsedCommand {
  const key = PRESSED_KEYS[label];
  if (key && verb === "press") {
    return { kind: "intent", intent: { kind: "keys", key, modifiers: [] } };
  }
  return { kind: "intent", intent: { kind: "click", label } };
}

export function parseScreenCommand(command: string): ParsedCommand | null {
  const label = CLICK.exec(command)?.[1];
  if (!label) return null;
  const [verb = ""] = command.split(" ");
  return clickOrKey(verb, label);
}
