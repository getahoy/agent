import { commandCopy } from "../../copy/commandCopy.ts";
import type { CommandOutcome } from "../../core/commands/commandLog.ts";
import type { Intent } from "../../core/commands/intent.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import { pressKeys, typeText } from "./helperIntents.ts";
import { openWith, osaScript } from "./osaScript.ts";
import { runTabIntent } from "./tabIntents.ts";
import { runWebIntent } from "./webIntents.ts";

const SYSTEM_EVENTS = "System Events";

const QUIT_SCRIPT = [
  "on run argv",
  "set appName to item 1 of argv",
  'if application appName is not running then return "notRunning"',
  "tell application appName to quit",
  'return "done"',
  "end run",
];

const HIDE_SCRIPT = [
  "on run argv",
  "set appName to item 1 of argv",
  'if application appName is not running then return "notRunning"',
  "set bundleId to id of application appName",
  'tell application "System Events"',
  "set visible of (first application process whose bundle identifier is bundleId) to false",
  "end tell",
  'return "done"',
  "end run",
];

const ACTIVATE_SCRIPT = [
  "on run argv",
  "tell application (item 1 of argv) to activate",
  "end run",
];

type ScriptOutcomes = {
  done: string;
  timedOut: CommandOutcome;
  controls: string;
};

function done(message: string): CommandOutcome {
  return { status: "done", message };
}

function failed(message: string): CommandOutcome {
  return { status: "failed", message };
}

const FAILED = failed(commandCopy.failed);

async function scripted(
  lines: readonly string[],
  app: string,
  outcomes: ScriptOutcomes,
): Promise<CommandOutcome> {
  const script = await osaScript("AppleScript", lines, [app]);
  switch (script.kind) {
    case "notAllowed":
      return failed(commandCopy.allowControl(outcomes.controls));
    case "timedOut":
      return outcomes.timedOut;
    case "answered": {
      const running = script.answer !== "notRunning";
      return running ? done(outcomes.done) : failed(commandCopy.notOpen(app));
    }
    default: {
      const unhandled: never = script;
      throw new Error(`Unhandled script ${JSON.stringify(unhandled)}`);
    }
  }
}

export async function runIntent(
  intent: Intent,
  helper: HelperClient,
): Promise<CommandOutcome> {
  switch (intent.kind) {
    case "open":
      await openWith(["-a", intent.app]);
      return done(commandCopy.opened(intent.app));
    case "quit":
      return scripted(QUIT_SCRIPT, intent.app, {
        done: commandCopy.closed(intent.app),
        timedOut: done(commandCopy.askedToQuit(intent.app)),
        controls: intent.app,
      });
    case "hide":
      return scripted(HIDE_SCRIPT, intent.app, {
        done: commandCopy.hid(intent.app),
        timedOut: FAILED,
        controls: SYSTEM_EVENTS,
      });
    case "activate":
      return scripted(ACTIVATE_SCRIPT, intent.app, {
        done: commandCopy.switched(intent.app),
        timedOut: FAILED,
        controls: intent.app,
      });
    case "search":
    case "openSite":
    case "draftEmail":
      return runWebIntent(intent);
    case "keys":
      return pressKeys(helper, intent);
    case "type":
      return typeText(helper, intent.text);
    case "closeTab":
    case "switchTab":
      return runTabIntent(intent);
    case "click":
      return failed(commandCopy.cannotDoYet);
    default: {
      const unhandled: never = intent;
      throw new Error(`Unhandled intent ${JSON.stringify(unhandled)}`);
    }
  }
}
