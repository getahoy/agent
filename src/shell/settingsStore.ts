import { readFile } from "node:fs/promises";
import { appearanceSchema, parseStored } from "@getahoy/lib";
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
  lanOffUntil: z.int().nullable().default(null),
  blockedApps: z.array(blockedAppSchema).default([...DEFAULT_BLOCKED_APPS]),
  appearance: appearanceSchema.catch("system"),
});

export type Settings = z.infer<typeof settingsSchema>;

const defaultSettings: Settings = {
  onboardingStep: "welcome",
  lanEnabled: true,
  lanOffUntil: null,
  blockedApps: [...DEFAULT_BLOCKED_APPS],
  appearance: "system",
};

export async function readSettings(filePath: string): Promise<Settings> {
  const text = await readFile(filePath, "utf8").catch(() => null);
  return parseStored(settingsSchema, text) ?? defaultSettings;
}

export async function writeSettings(
  filePath: string,
  settings: Settings,
): Promise<void> {
  await writeFileAtomic(filePath, JSON.stringify(settings));
}
