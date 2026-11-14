import type { Logger } from "@getahoy/lib";
import type { UnderstoodBy } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import { systemCopy } from "../../copy/systemCopy.ts";
import {
  because,
  type CommandOutcome,
  done,
  failed,
  refused,
} from "../../core/commands/commandLog.ts";
import type {
  Intent,
  ParsedCommand,
  RunnableIntent,
} from "../../core/commands/intent.ts";
import { appOfIntent } from "../../core/commands/outcomeDetails.ts";
import { parseCommand } from "../../core/commands/parseCommand.ts";
import {
  type LastStep,
  rememberStep,
  repeatStep,
} from "../../core/commands/stepMemory.ts";
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

// "More" repeats the step of the command just before, so each command starts from a clean slate.
type StepBox = { previous: LastStep | null; last: LastStep | null };

const SCREEN_INTENTS: ReadonlySet<Intent["kind"]> = new Set([
  "click",
  "keys",
  "type",
  "scroll",
]);
const FRONT_APP_INTENTS: ReadonlySet<Intent["kind"]> = new Set([
  "navigate",
  "window",
]);

function withApp(outcome: CommandOutcome, app: string | null) {
  return app ? { ...outcome, app } : outcome;
}

function understood(outcome: CommandOutcome, via: UnderstoodBy) {
  return { ...outcome, via };
}

// Not knowing which app is in front counts as blocked: the list must fail closed.
async function runGuarded(
  intent: RunnableIntent,
  options: CommandRunnerOptions,
): Promise<CommandOutcome> {
  if (FRONT_APP_INTENTS.has(intent.kind)) {
    const frontName = await frontAppName();
    return withApp(await runIntent(intent, options.helper), frontName);
  }
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

async function runStep(
  intent: Intent,
  options: CommandRunnerOptions,
  steps: StepBox,
): Promise<CommandOutcome> {
  const now = Date.now();
  const runnable =
    intent.kind === "again" ? repeatStep(steps.previous, intent, now) : intent;
  if (!runnable) return failed(systemCopy.moreOfWhat);
  const outcome = await runGuarded(runnable, options);
  steps.last = outcome.status === "done" ? rememberStep(runnable, now) : null;
  return outcome;
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
  steps: StepBox,
): Promise<CommandOutcome> {
  const messages: string[] = [];
  let actedOn: string | null = null;
  for (const [index, intent] of intents.entries()) {
    const outcome = await runStep(intent, options, steps);
    if (intents.length === 1 || outcome.status !== "done") return outcome;
    actedOn = outcome.app ?? actedOn;
    messages.push(outcome.message);
    const app = appBeforeInput(intent, intents[index + 1]);
    if (app && !(await waitUntilFrontmost(app))) {
      return withApp(failed(commandCopy.notInFront(app)), app);
    }
  }
  return withApp(done(messages.join(", ")), actedOn);
}

type Heard = { text: string; apps: readonly string[]; parsed: Unmatched };

async function viaInterpreter(
  { text, apps, parsed }: Heard,
  options: CommandRunnerOptions,
  steps: StepBox,
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
  return runInOrder(validation.intents, options, steps);
}

export function createCommandRunner(options: CommandRunnerOptions) {
  const steps: StepBox = { previous: null, last: null };
  const run = async (text: string): Promise<CommandOutcome> => {
    steps.previous = steps.last;
    steps.last = null;
    const apps = await installedApps();
    const parsed = parseCommand(text, apps);
    switch (parsed.kind) {
      case "intent": {
        const outcome = await runStep(parsed.intent, options, steps);
        return understood(outcome, "rules");
      }
      case "ambiguous": {
        const message = commandCopy.which(parsed.apps);
        return understood({ status: "needsChoice", message }, "rules");
      }
      case "refuse":
        return understood(failed(systemCopy.refused(parsed.reason)), "rules");
      case "unknownApp":
      case "unsupported": {
        const context = { text, apps, parsed };
        const outcome = await viaInterpreter(context, options, steps);
        return understood(outcome, "ai");
      }
      default: {
        const unhandled: never = parsed;
        throw new Error(`Unhandled command ${JSON.stringify(unhandled)}`);
      }
    }
  };
  const forgetStep = () => {
    steps.last = null;
  };
  return { run, forgetStep };
}
