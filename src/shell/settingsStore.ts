import { readFile } from "node:fs/promises";
import writeFileAtomic from "write-file-atomic";
import { z } from "zod";
import { onboardingStepSchema } from "../core/appState/appState.ts";
import { DEFAULT_BLOCKED_APPS } from "../core/safety/blockedApps.ts";

const blockedAppSchema = z.object({
  kind: z.literal("bundleId"),
  value: z.string().min(1),
});

const settingsSchema = z.object({
  onboardingStep: onboardingStepSchema,
  lanEnabled: z.boolean().default(true),
  blockedApps: z.array(blockedAppSchema).default([...DEFAULT_BLOCKED_APPS]),
});

export type Settings = z.infer<typeof settingsSchema>;

const defaultSettings: Settings = {
  onboardingStep: "welcome",
  lanEnabled: true,
  blockedApps: [...DEFAULT_BLOCKED_APPS],
};

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
  await writeFileAtomic(filePath, JSON.stringify(settings));
}
