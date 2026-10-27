import type { Logger } from "@getahoy/lib";
import { commandCopy } from "../../copy/commandCopy.ts";
import type { CommandOutcome } from "../../core/commands/commandLog.ts";
import type { Intent, ParsedCommand } from "../../core/commands/intent.ts";
import { parseCommand } from "../../core/commands/parseCommand.ts";
import { validateActions } from "../../core/commands/validateActions.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import type { Interpreter } from "../interpret/interpretApi.ts";
import { waitUntilFrontmost } from "./frontApp.ts";
import { installedApps } from "./installedApps.ts";
import { runIntent } from "./runIntent.ts";

type CommandRunnerOptions = {
  helper: HelperClient;
  interpret: Interpreter;
  logger: Logger;
};

type Unmatched = Extract<ParsedCommand, { kind: "unknownApp" | "unsupported" }>;

function notUnderstood(parsed: Unmatched): CommandOutcome {
  const message =
    parsed.kind === "unknownApp"
      ? commandCopy.noSuchApp(parsed.name)
      : commandCopy.cannotDoYet;
  return { status: "failed", message };
}

function appBeforeInput(intent: Intent, next: Intent | undefined) {
  if (next?.kind !== "keys" && next?.kind !== "type") return null;
  return intent.kind === "open" || intent.kind === "activate"
    ? intent.app
    : null;
}

async function runInOrder(
  intents: readonly Intent[],
  helper: HelperClient,
): Promise<CommandOutcome> {
  const messages: string[] = [];
  for (const [index, intent] of intents.entries()) {
    const outcome = await runIntent(intent, helper);
    if (outcome.status !== "done") return outcome;
    messages.push(outcome.message);
    const app = appBeforeInput(intent, intents[index + 1]);
    if (app && !(await waitUntilFrontmost(app))) {
      return { status: "failed", message: commandCopy.notInFront(app) };
    }
  }
  return { status: "done", message: messages.join(", ") };
}

async function viaInterpreter(
  text: string,
  apps: readonly string[],
  parsed: Unmatched,
  options: CommandRunnerOptions,
): Promise<CommandOutcome> {
  const { interpret, logger, helper } = options;
  const interpretation = await interpret(text, apps);
  if (interpretation.kind === "failed") {
    logger.warn("command", `Smart commands ${interpretation.reason}`);
    return { status: "failed", message: commandCopy.smartUnavailable };
  }
  if (interpretation.actions.length === 0) {
    logger.info("command", "Smart commands none");
    return notUnderstood(parsed);
  }
  const validation = validateActions(interpretation.actions, text, apps);
  if (validation.kind === "rejected") {
    logger.warn("command", "Smart commands rejected");
    return { status: "failed", message: commandCopy.cannotDoYet };
  }
  return runInOrder(validation.intents, helper);
}

export function createCommandRunner(options: CommandRunnerOptions) {
  const { helper } = options;
  return async (text: string): Promise<CommandOutcome> => {
    const apps = await installedApps();
    const parsed = parseCommand(text, apps);
    switch (parsed.kind) {
      case "intent":
        return runIntent(parsed.intent, helper);
      case "ambiguous": {
        const message = commandCopy.which(parsed.apps);
        return { status: "needsChoice", message };
      }
      case "unknownApp":
      case "unsupported":
        return viaInterpreter(text, apps, parsed, options);
      default: {
        const unhandled: never = parsed;
        throw new Error(`Unhandled command ${JSON.stringify(unhandled)}`);
      }
    }
  };
}
