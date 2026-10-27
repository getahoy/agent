import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { commandCopy } from "../../copy/commandCopy.ts";
import type { CommandOutcome } from "../../core/commands/commandLog.ts";
import type { Intent } from "../../core/commands/intent.ts";

const run = promisify(execFile);
const COMMAND_TIMEOUT_MS = 5000;
const NOT_ALLOWED_CODE = "(-1743)";
const SEARCH_URL = "https://www.google.com/search?q=";
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
  'tell application "System Events"',
  "set visible of (first application process whose displayed name is appName) to false",
  "end tell",
  'return "done"',
  "end run",
];

const ACTIVATE_SCRIPT = [
  "on run argv",
  "tell application (item 1 of argv) to activate",
  "end run",
];

type Script =
  | { kind: "answered"; answer: string }
  | { kind: "timedOut" }
  | { kind: "notAllowed" };

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

function scriptFailure(error: unknown): Script | null {
  if (!(error instanceof Error)) return null;
  if ("killed" in error && error.killed === true) return { kind: "timedOut" };
  const stderr = "stderr" in error ? String(error.stderr) : "";
  return stderr.includes(NOT_ALLOWED_CODE) ? { kind: "notAllowed" } : null;
}

async function appleScript(lines: readonly string[], app: string) {
  const script = lines.flatMap((line) => ["-e", line]);
  const options = { timeout: COMMAND_TIMEOUT_MS };
  try {
    const { stdout } = await run("osascript", [...script, app], options);
    return { kind: "answered", answer: stdout.trim() } satisfies Script;
  } catch (error) {
    const failure = scriptFailure(error);
    if (!failure) throw error;
    return failure;
  }
}

async function scripted(
  lines: readonly string[],
  app: string,
  outcomes: ScriptOutcomes,
): Promise<CommandOutcome> {
  const script = await appleScript(lines, app);
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

async function openWith(args: string[]): Promise<void> {
  await run("open", args, { timeout: COMMAND_TIMEOUT_MS });
}

export async function runIntent(intent: Intent): Promise<CommandOutcome> {
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
      await openWith([`${SEARCH_URL}${encodeURIComponent(intent.query)}`]);
      return done(commandCopy.searched(intent.query));
    case "openSite":
      await openWith([`https://${intent.host}`]);
      return done(commandCopy.opened(intent.host));
    default: {
      const unhandled: never = intent;
      throw new Error(`Unhandled intent ${JSON.stringify(unhandled)}`);
    }
  }
}
