import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const SCRIPT_TIMEOUT_MS = 5000;
const NOT_ALLOWED_CODE = "(-1743)";

type ScriptLanguage = "AppleScript" | "JavaScript";

export type ScriptAnswer =
  | { kind: "answered"; answer: string }
  | { kind: "timedOut" }
  | { kind: "notAllowed" };

function scriptFailure(error: unknown): ScriptAnswer | null {
  if (!(error instanceof Error)) return null;
  if ("killed" in error && error.killed === true) return { kind: "timedOut" };
  const stderr = "stderr" in error ? String(error.stderr) : "";
  return stderr.includes(NOT_ALLOWED_CODE) ? { kind: "notAllowed" } : null;
}

export async function osaScript(
  language: ScriptLanguage,
  lines: readonly string[],
  args: readonly string[],
): Promise<ScriptAnswer> {
  const script = lines.flatMap((line) => ["-e", line]);
  const options = { timeout: SCRIPT_TIMEOUT_MS };
  try {
    const argv = ["-l", language, ...script, ...args];
    const { stdout } = await run("osascript", argv, options);
    return { kind: "answered", answer: stdout.trim() };
  } catch (error) {
    const failure = scriptFailure(error);
    if (!failure) throw error;
    return failure;
  }
}

export async function openWith(args: readonly string[]): Promise<void> {
  await run("open", [...args], { timeout: SCRIPT_TIMEOUT_MS });
}
