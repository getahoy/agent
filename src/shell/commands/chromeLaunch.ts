import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";

const run = promisify(execFile);
const CHROME = "Google Chrome";
const LOCAL_STATE = path.join(
  homedir(),
  "Library",
  "Application Support",
  "Google",
  "Chrome",
  "Local State",
);
const localStateSchema = z.object({
  profile: z.object({ last_used: z.string().min(1) }),
});

function chromeRunning(): Promise<boolean> {
  return run("pgrep", ["-x", CHROME]).then(
    () => true,
    () => false,
  );
}

async function lastUsedProfile(): Promise<string | null> {
  try {
    const parsed = JSON.parse(await readFile(LOCAL_STATE, "utf8"));
    const state = localStateSchema.safeParse(parsed);
    return state.success ? state.data.profile.last_used : null;
  } catch {
    return null;
  }
}

// On a cold start Chrome can show its profile picker, which drops the URL; naming the last
// used profile skips the picker. A running Chrome opens the URL in its own window.
export async function browserOpenArgs(
  browser: string,
  url: string,
): Promise<string[]> {
  const plain = ["-a", browser, url];
  if (browser !== CHROME || (await chromeRunning())) return plain;
  const profile = await lastUsedProfile();
  if (!profile) return plain;
  return ["-na", browser, "--args", `--profile-directory=${profile}`, url];
}
