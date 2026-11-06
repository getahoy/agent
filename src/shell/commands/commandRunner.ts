import type { Logger } from "@getahoy/lib";
import type { UnderstoodBy } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import {
  because,
  type CommandOutcome,
  done,
  failed,
  refused,
} from "../../core/commands/commandLog.ts";
import type { Intent, ParsedCommand } from "../../core/commands/intent.ts";
import { appOfIntent } from "../../core/commands/outcomeDetails.ts";
import { parseCommand } from "../../core/commands/parseCommand.ts";
import { validateActions } from "../../core/commands/validateActions.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import {
  type BlockedApp,
  isBlockedApp,
} from "../../core/safety/blockedApps.ts";
import type { Interpreter } from "../interpret/interpretApi.ts";
import { frontAppName, frontBundleId, waitUntilFrontmost } from "./frontApp.ts";
import { installedApps } from "./installedApps.ts";
import { runIntent } from "./runIntent.ts";

type CommandRunnerOptions = {
  helper: HelperClient;
  interpret: Interpreter;
  blockedApps: readonly BlockedApp[];
  logger: Logger;
};

const SCREEN_INTENTS: ReadonlySet<Intent["kind"]> = new Set([
  "click",
  "keys",
  "type",
]);

function withApp(outcome: CommandOutcome, app: string | null) {
  return app ? { ...outcome, app } : outcome;
}

function understood(outcome: CommandOutcome, via: UnderstoodBy) {
  return { ...outcome, via };
}

// Not knowing which app is in front counts as blocked: the list must fail closed.
async function runGuarded(
  intent: Intent,
  options: CommandRunnerOptions,
): Promise<CommandOutcome> {
  if (!SCREEN_INTENTS.has(intent.kind)) {
    const outcome = await runIntent(intent, options.helper);
    return withApp(outcome, appOfIntent(intent));
  }
  const [front, frontName] = await Promise.all([
    frontBundleId(),
    frontAppName(),
  ]);
  if (!front || isBlockedApp(front, options.blockedApps)) {
    const blocked = because(refused(commandCopy.blockedApp), "blockedApp");
    return withApp(blocked, frontName);
  }
  return withApp(await runIntent(intent, options.helper), frontName);
}

type Unmatched = Extract<ParsedCommand, { kind: "unknownApp" | "unsupported" }>;

function notUnderstood(parsed: Unmatched): CommandOutcome {
  if (parsed.kind === "unsupported") return failed(commandCopy.cannotDoYet);
  const noSuchApp = failed(commandCopy.noSuchApp(parsed.name));
  return because(noSuchApp, "unknownApp");
}

function appBeforeInput(intent: Intent, next: Intent | undefined) {
  if (next?.kind !== "keys" && next?.kind !== "type") return null;
  return intent.kind === "open" || intent.kind === "activate"
    ? intent.app
    : null;
}

async function runInOrder(
  intents: readonly Intent[],
  options: CommandRunnerOptions,
): Promise<CommandOutcome> {
  const messages: string[] = [];
  let actedOn: string | null = null;
  for (const [index, intent] of intents.entries()) {
    const outcome = await runGuarded(intent, options);
    if (outcome.status !== "done") return outcome;
    actedOn = outcome.app ?? actedOn;
    messages.push(outcome.message);
    const app = appBeforeInput(intent, intents[index + 1]);
    if (app && !(await waitUntilFrontmost(app))) {
      return withApp(failed(commandCopy.notInFront(app)), app);
    }
  }
  return withApp(done(messages.join(", ")), actedOn);
}

async function viaInterpreter(
  text: string,
  apps: readonly string[],
  parsed: Unmatched,
  options: CommandRunnerOptions,
): Promise<CommandOutcome> {
  const { interpret, logger } = options;
  const interpretation = await interpret(text, apps);
  if (interpretation.kind === "failed") {
    logger.warn("command", `Smart commands ${interpretation.reason}`);
    return failed(commandCopy.smartUnavailable);
  }
  if (interpretation.actions.length === 0) {
    logger.info("command", "Smart commands none");
    return notUnderstood(parsed);
  }
  const validation = validateActions(interpretation.actions, text, apps);
  if (validation.kind === "rejected") {
    logger.warn("command", "Smart commands rejected");
    return failed(commandCopy.cannotDoYet);
  }
  return runInOrder(validation.intents, options);
}

export function createCommandRunner(options: CommandRunnerOptions) {
  return async (text: string): Promise<CommandOutcome> => {
    const apps = await installedApps();
    const parsed = parseCommand(text, apps);
    switch (parsed.kind) {
      case "intent":
        return understood(await runGuarded(parsed.intent, options), "rules");
      case "ambiguous": {
        const message = commandCopy.which(parsed.apps);
        return understood({ status: "needsChoice", message }, "rules");
      }
      case "unknownApp":
      case "unsupported": {
        const outcome = await viaInterpreter(text, apps, parsed, options);
        return understood(outcome, "ai");
      }
      default: {
        const unhandled: never = parsed;
        throw new Error(`Unhandled command ${JSON.stringify(unhandled)}`);
      }
    }
  };
}
