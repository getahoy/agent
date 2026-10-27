import type { KeyModifier } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import type { CommandOutcome } from "../../core/commands/commandLog.ts";
import type { Shortcut } from "../../core/commands/shortcutRules.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import type { Modifier } from "../../core/helper/helperProtocol.ts";

const FAILED: CommandOutcome = {
  status: "failed",
  message: commandCopy.failed,
};

const macModifiers: Record<KeyModifier, Modifier> = {
  mod: "command",
  shift: "shift",
  alt: "option",
  control: "control",
};

export async function pressKeys(
  helper: HelperClient,
  shortcut: Shortcut,
): Promise<CommandOutcome> {
  const modifiers = shortcut.modifiers.map(
    (modifier) => macModifiers[modifier],
  );
  const pressed = await helper.request("key", { key: shortcut.key, modifiers });
  if (!pressed.ok) return FAILED;
  return { status: "done", message: commandCopy.pressed(shortcut) };
}

export async function typeText(
  helper: HelperClient,
  text: string,
): Promise<CommandOutcome> {
  const typed = await helper.request("type", { text });
  if (typed.ok) return { status: "done", message: commandCopy.typed(text) };
  if (typed.error.code === "secure_input") {
    return { status: "refused", message: commandCopy.secureInput };
  }
  return FAILED;
}
