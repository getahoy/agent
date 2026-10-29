import type { KeyModifier } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import {
  type CommandOutcome,
  done,
  failed,
  refused,
  spoken,
} from "../../core/commands/commandLog.ts";
import type { Shortcut } from "../../core/commands/shortcutRules.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import type { Modifier } from "../../core/helper/helperProtocol.ts";

const FAILED = failed(commandCopy.failed);

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
  const message = commandCopy.pressedAloud(shortcut);
  return spoken(done(commandCopy.pressed(shortcut)), { kind: "done", message });
}

export async function typeText(
  helper: HelperClient,
  text: string,
): Promise<CommandOutcome> {
  const typed = await helper.request("type", { text });
  if (typed.ok) return done(commandCopy.typed(text));
  const secure = typed.error.code === "secure_input";
  return secure ? refused(commandCopy.secureInput) : FAILED;
}
