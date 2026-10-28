import type { KeyModifier, KeyName } from "@getahoy/protocol";
import type { ParsedCommand } from "./intent.ts";

const CLICK = /^(?:click|press|tap)(?: on)? (?:the )?(.+?)(?: button| link)?$/;
const SCROLL = /^(?:scroll|page) (up|down)$/;
const EDGE = /^(?:go|scroll|jump) to (?:the )?(top|bottom)$/;

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

function keys(key: KeyName, modifiers: KeyModifier[] = []): ParsedCommand {
  return { kind: "intent", intent: { kind: "keys", key, modifiers } };
}

function clickOrKey(verb: string, label: string): ParsedCommand {
  const key = PRESSED_KEYS[label];
  if (key && verb === "press") return keys(key);
  return { kind: "intent", intent: { kind: "click", label } };
}

export function parseScreenCommand(command: string): ParsedCommand | null {
  const scroll = SCROLL.exec(command)?.[1];
  if (scroll) return keys(scroll === "up" ? "pageUp" : "pageDown");
  const edge = EDGE.exec(command)?.[1];
  if (edge) return keys(edge === "top" ? "up" : "down", ["mod"]);
  const click = CLICK.exec(command);
  const label = click?.[1];
  if (!click || !label) return null;
  const [verb = ""] = command.split(" ");
  return clickOrKey(verb, label);
}
