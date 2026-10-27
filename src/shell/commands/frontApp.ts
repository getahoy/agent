import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const POLL_MS = 100;
const FRONT_TIMEOUT_MS = 3000;
const APP_EXTENSION = ".app";
const FRONT_APP_SCRIPT = "POSIX path of (path to frontmost application)";

export function appNameOfBundle(bundlePath: string): string | null {
  const bundle = path.basename(bundlePath);
  if (!bundle.endsWith(APP_EXTENSION)) return null;
  return bundle.slice(0, -APP_EXTENSION.length);
}

export async function frontApp(): Promise<string | null> {
  const options = { timeout: FRONT_TIMEOUT_MS };
  const answer = await run("osascript", ["-e", FRONT_APP_SCRIPT], options)
    .then(({ stdout }) => stdout.trim())
    .catch(() => "");
  return appNameOfBundle(answer);
}

export async function waitUntilFrontmost(app: string): Promise<boolean> {
  const deadline = Date.now() + FRONT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if ((await frontApp()) === app) return true;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  return false;
}
