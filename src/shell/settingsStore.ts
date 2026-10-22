import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { onboardingStepSchema } from "../core/appState/appState.ts";

const settingsSchema = z.object({ onboardingStep: onboardingStepSchema });

export type Settings = z.infer<typeof settingsSchema>;

const defaultSettings: Settings = { onboardingStep: "welcome" };

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function readSettings(filePath: string): Promise<Settings> {
  const text = await readFile(filePath, "utf8").catch(() => null);
  if (text === null) return defaultSettings;
  const parsed = settingsSchema.safeParse(parseJson(text));
  return parsed.success ? parsed.data : defaultSettings;
}

export async function writeSettings(
  filePath: string,
  settings: Settings,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const pendingPath = `${filePath}.pending`;
  await writeFile(pendingPath, JSON.stringify(settings));
  await rename(pendingPath, filePath);
}
