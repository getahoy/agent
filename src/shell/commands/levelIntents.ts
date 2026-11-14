import { commandCopy } from "../../copy/commandCopy.ts";
import { systemCopy } from "../../copy/systemCopy.ts";
import {
  type CommandOutcome,
  failed,
  quietly,
} from "../../core/commands/commandLog.ts";
import type { MacAction } from "../../core/commands/intent.ts";
import {
  brightnessKeyPresses,
  type LevelChange,
  type LevelPlan,
  planLevel,
} from "../../core/commands/levelChange.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import { osaScript } from "./osaScript.ts";

type LevelName = "Volume" | "Brightness";
type Moved = Extract<LevelPlan, { kind: "move" }>;
type VolumeIntent = Extract<MacAction, { kind: "volume" }>;
type VolumeReading = { level: number; muted: boolean };

const FAILED = failed(commandCopy.failed);
const READ_VOLUME = [
  "set settings to get volume settings",
  "set level to (output volume of settings) as text",
  'return level & "," & ((output muted of settings) as text)',
];
const SET_VOLUME = [
  "on run argv",
  "set volume output volume (item 1 of argv as integer) without output muted",
  "end run",
];
const SOUND_SWITCH = {
  mute: ["set volume with output muted"],
  unmute: ["set volume without output muted"],
} as const;

function landed(name: LevelName, plan: Moved, to: number): CommandOutcome {
  if (plan.clamped === "max") return quietly(systemCopy.levelMax(name));
  if (plan.clamped === "min") return quietly(systemCopy.levelMin(name));
  return quietly(systemCopy.levelMoved(name, plan.from, to));
}

function already(name: LevelName, level: number): CommandOutcome {
  return quietly(systemCopy.levelAlready(name, level));
}

async function readVolume(): Promise<VolumeReading | null> {
  const script = await osaScript("AppleScript", READ_VOLUME, []);
  if (script.kind !== "answered") return null;
  const [level, muted] = script.answer.split(",");
  const value = Number(level);
  if (!Number.isInteger(value)) return null;
  return { level: value, muted: muted === "true" };
}

export async function runVolume(intent: VolumeIntent): Promise<CommandOutcome> {
  const { action } = intent;
  if (action === "mute" || action === "unmute") {
    const script = await osaScript("AppleScript", SOUND_SWITCH[action], []);
    if (script.kind !== "answered") return FAILED;
    return quietly(action === "mute" ? systemCopy.muted : systemCopy.unmuted);
  }
  const reading = await readVolume();
  if (!reading) return failed(systemCopy.noVolumeControl);
  const plan = planLevel(reading.level, { action, percent: intent.percent });
  const to = plan.kind === "move" ? plan.to : plan.level;
  // Any level command unmutes, so an unchanged level is still set when muted.
  if (plan.kind === "unchanged" && !reading.muted) return already("Volume", to);
  const set = await osaScript("AppleScript", SET_VOLUME, [String(to)]);
  if (set.kind !== "answered") return FAILED;
  if (plan.kind === "unchanged") return already("Volume", to);
  return landed("Volume", plan, to);
}

async function pressBrightnessKeys(
  change: LevelChange,
  helper: HelperClient,
): Promise<CommandOutcome> {
  for (const { direction, presses } of brightnessKeyPresses(change)) {
    const key = direction === "up" ? "brightnessUp" : "brightnessDown";
    for (let press = 0; press < presses; press += 1) {
      const pressed = await helper.request("systemKey", { key });
      if (!pressed.ok) return FAILED;
    }
  }
  if (change.action === "set") {
    return quietly(systemCopy.brightnessAbout(change.percent ?? 0));
  }
  return quietly(systemCopy.brightnessStepped(change.action));
}

export async function runBrightness(
  change: LevelChange,
  helper: HelperClient,
): Promise<CommandOutcome> {
  const reading = await helper.request("brightness", {});
  if (!reading.ok) {
    const { code } = reading.error;
    if (code === "no_built_in_display") {
      return failed(systemCopy.refused("externalDisplay"));
    }
    if (code === "unavailable") return pressBrightnessKeys(change, helper);
    return FAILED;
  }
  const plan = planLevel(reading.output.level, change);
  if (plan.kind === "unchanged") return already("Brightness", plan.level);
  const set = await helper.request("brightness", { level: plan.to });
  if (!set.ok) return pressBrightnessKeys(change, helper);
  return landed("Brightness", plan, set.output.level);
}
