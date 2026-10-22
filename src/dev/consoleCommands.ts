import { setTimeout as wait } from "node:timers/promises";
import type { HelperClient } from "../core/helper/helperClient.ts";
import { parseKeyCombo } from "./keyCombo.ts";
import { printOutcome, printSnapshot } from "./printOutcome.ts";

const MS_PER_SECOND = 1000;

export type ConsoleSettings = { delaySeconds: number };
export type ConsoleContext = {
  client: HelperClient;
  settings: ConsoleSettings;
};
type Command = (args: string[], context: ConsoleContext) => Promise<void>;

const helpText = `  snapshot            read the front window after the countdown
  click <ref>         press an element from the latest snapshot, e.g. click e12
  key <combo>         press keys after the countdown, e.g. key cmd+shift+p
  type <text>         type text after the countdown
  capture [display]   screenshot a display to a PNG and print its path
  delay <seconds>     countdown before snapshot, key and type (now %DELAY%s)
  help, quit`;

async function countdown({ settings }: ConsoleContext): Promise<void> {
  for (let left = settings.delaySeconds; left > 0; left -= 1) {
    console.log(`  switch to the target app, ${left}...`);
    await wait(MS_PER_SECOND);
  }
}

const commands: Record<string, Command> = {
  help: async (_args, { settings }) => {
    console.log(helpText.replace("%DELAY%", String(settings.delaySeconds)));
  },
  delay: async ([seconds], { settings }) => {
    const parsed = Number(seconds);
    if (!Number.isInteger(parsed) || parsed < 0) {
      console.log("  delay needs whole seconds");
      return;
    }
    settings.delaySeconds = parsed;
  },
  snapshot: async (_args, context) => {
    await countdown(context);
    printOutcome(await context.client.request("snapshot", {}), printSnapshot);
  },
  click: async ([ref], { client }) => {
    if (!ref) return console.log("  click needs a ref, e.g. click e12");
    printOutcome(await client.request("click", { ref }), (output) =>
      console.log(`  clicked ${ref} by ${output.method}`),
    );
  },
  key: async ([text = ""], context) => {
    const combo = parseKeyCombo(text);
    if (!combo) return console.log("  key needs a combo, e.g. key cmd+s");
    await countdown(context);
    printOutcome(await context.client.request("key", combo), (output) =>
      console.log(`  pressed ${[...output.modifiers, output.key].join("+")}`),
    );
  },
  type: async (words, context) => {
    if (words.length === 0) return console.log("  type needs text");
    await countdown(context);
    printOutcome(
      await context.client.request("type", { text: words.join(" ") }),
      (output) => console.log(`  typed ${output.characters} characters`),
    );
  },
  capture: async ([display], { client }) => {
    const args = display ? { displayId: Number(display) } : {};
    printOutcome(await client.request("capture", args), (output) =>
      console.log(`  saved ${output.width}x${output.height} to ${output.path}`),
    );
  },
};

export async function runCommand(
  line: string,
  context: ConsoleContext,
): Promise<boolean> {
  const [name = "", ...args] = line.trim().split(/\s+/);
  if (name === "quit" || name === "exit") return false;
  if (name === "") return true;
  const command = commands[name];
  if (!command) {
    console.log("  unknown command, type help");
    return true;
  }
  await command(args, context);
  return true;
}
