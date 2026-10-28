import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const POLL_MS = 100;
const FRONT_TIMEOUT_MS = 3000;
const APP_EXTENSION = ".app";
const FRONT_PATH = "POSIX path of (path to frontmost application)";
const FRONT_BUNDLE_ID =
  "id of application (path to frontmost application as text)";

async function askFrontmost(script: string): Promise<string | null> {
  const options = { timeout: FRONT_TIMEOUT_MS };
  const answer = await run("osascript", ["-e", script], options)
    .then(({ stdout }) => stdout.trim())
    .catch(() => "");
  return answer === "" ? null : answer;
}

async function frontAppName(): Promise<string | null> {
  const bundle = path.basename((await askFrontmost(FRONT_PATH)) ?? "");
  if (!bundle.endsWith(APP_EXTENSION)) return null;
  return bundle.slice(0, -APP_EXTENSION.length);
}

export function frontBundleId(): Promise<string | null> {
  return askFrontmost(FRONT_BUNDLE_ID);
}

export async function waitUntilFrontmost(app: string): Promise<boolean> {
  const deadline = Date.now() + FRONT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if ((await frontAppName()) === app) return true;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  return false;
}
