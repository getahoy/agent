import type { Logger } from "@getahoy/lib";
import type { UnderstoodBy } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import { systemCopy } from "../../copy/systemCopy.ts";
import {
  because,
  type CommandOutcome,
  done,
  failed,
} from "../../core/commands/commandLog.ts";
import type { Intent, ParsedCommand } from "../../core/commands/intent.ts";
import { parseCommand } from "../../core/commands/parseCommand.ts";
import {
  type LastStep,
  rememberStep,
  repeatStep,
} from "../../core/commands/stepMemory.ts";
import { validateActions } from "../../core/commands/validateActions.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import type { BlockedApp } from "../../core/safety/blockedApps.ts";
import type { Interpretation, Interpreter } from "../interpret/interpretApi.ts";
import { waitUntilFrontmost } from "./frontApp.ts";
import { runGuarded, withApp } from "./guardedRun.ts";
import { installedApps } from "./installedApps.ts";
import { screenMovedOn, unlessCancelled } from "./lateAnswer.ts";
import { screenAtStart } from "./screenControls.ts";

type CommandRunnerOptions = {
  helper: HelperClient;
  interpret: Interpreter;
  blockedApps: readonly BlockedApp[];
  accountEmail: () => string | null;
  logger: Logger;
};

// "More" repeats the step of the command just before, so each command starts from a clean slate.
type StepBox = { previous: LastStep | null; last: LastStep | null };

function understood(outcome: CommandOutcome, via: UnderstoodBy) {
  return { ...outcome, via };
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

type Heard = {
  text: string;
  apps: readonly string[];
  parsed: Unmatched;
  cancel: AbortSignal;
};

const NO_BUTTON = because(failed(commandCopy.noButton), "targetNotFound");
const MOVED_ON = because(failed(commandCopy.screenMovedOn), "screenChanged");

type FailedReason = Extract<Interpretation, { kind: "failed" }>["reason"];

function smartFailure(reason: FailedReason, logger: Logger): CommandOutcome {
  logger.warn("command", `Smart commands ${reason}`);
  const timedOut = reason === "timedOut";
  return failed(
    timedOut ? commandCopy.tookTooLong : commandCopy.smartUnavailable,
  );
}

function logDrafts(intents: readonly Intent[], logger: Logger): void {
  for (const intent of intents) {
    if (intent.kind !== "draftEmail") continue;
    logger.info("command", `Draft recipient ${intent.recipient}`);
  }
}

async function viaInterpreter(
  { text, apps, parsed, cancel }: Heard,
  options: CommandRunnerOptions,
  steps: StepBox,
): Promise<CommandOutcome> {
  const { interpret, logger, helper, blockedApps } = options;
  const startedAt = Date.now();
  const start = await screenAtStart(helper, blockedApps);
  const screen = start.labels;
  const asked = interpret(text, apps, screen);
  const interpretation = await unlessCancelled(asked, cancel);
  if (!interpretation) return failed(commandCopy.cancelled);
  if (interpretation.kind === "failed") {
    return smartFailure(interpretation.reason, logger);
  }
  if (interpretation.actions.length === 0) {
    logger.info("command", "Smart commands none");
    return notUnderstood(parsed);
  }
  const validation = validateActions(interpretation.actions, {
    transcript: text,
    installedApps: apps,
    accountEmail: options.accountEmail(),
    screen,
  });
  if (validation.kind === "noButton") return NO_BUTTON;
  if (validation.kind === "rejected") {
    logger.warn("command", "Smart commands rejected");
    return failed(commandCopy.cannotDoYet);
  }
  const { intents } = validation;
  const late = { intents, startedAt, helper, start: start.state };
  if (await screenMovedOn(late)) return MOVED_ON;
  logDrafts(intents, logger);
  return runInOrder(intents, options, steps);
}

export function createCommandRunner(options: CommandRunnerOptions) {
  const steps: StepBox = { previous: null, last: null };
  const run = async (
    text: string,
    cancel: AbortSignal,
  ): Promise<CommandOutcome> => {
    steps.previous = steps.last;
    steps.last = null;
    const apps = await installedApps();
    const parsed = parseCommand(text, apps, options.accountEmail());
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
        const context = { text, apps, parsed, cancel };
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
