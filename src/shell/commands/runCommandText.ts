import { commandCopy } from "../../copy/commandCopy.ts";
import type { CommandOutcome } from "../../core/commands/commandLog.ts";
import { parseCommand } from "../../core/commands/parseCommand.ts";
import { installedApps } from "./installedApps.ts";
import { runIntent } from "./runIntent.ts";

export async function runCommandText(text: string): Promise<CommandOutcome> {
  const parsed = parseCommand(text, await installedApps());
  switch (parsed.kind) {
    case "intent":
      return runIntent(parsed.intent);
    case "ambiguous":
      return { status: "needsChoice", message: commandCopy.which(parsed.apps) };
    case "unknownApp":
      return { status: "failed", message: commandCopy.noSuchApp(parsed.name) };
    case "unsupported":
      return { status: "failed", message: commandCopy.cannotDoYet };
    default: {
      const unhandled: never = parsed;
      throw new Error(`Unhandled command ${JSON.stringify(unhandled)}`);
    }
  }
}
