export const DEFAULT_STEP = 10;
export const LITTLE_STEP = 5;
export const LOT_STEP = 25;
const LEVEL_MAX = 100;
const BRIGHTNESS_KEY_STEPS = 16;
const KEY_STEP_PERCENT = LEVEL_MAX / BRIGHTNESS_KEY_STEPS;

export type LevelChange = {
  action: "up" | "down" | "set";
  percent: number | null;
};

export type LevelPlan =
  | { kind: "move"; from: number; to: number; clamped: "max" | "min" | null }
  | { kind: "unchanged"; level: number };

export type KeyPress = { direction: "up" | "down"; presses: number };

function clamp(level: number): number {
  return Math.min(LEVEL_MAX, Math.max(0, level));
}

function wantedLevel(from: number, change: LevelChange): number {
  if (change.action === "set") return change.percent ?? from;
  const step = change.percent ?? DEFAULT_STEP;
  return change.action === "up" ? from + step : from - step;
}

function clampedEdge(wanted: number): "max" | "min" | null {
  if (wanted > LEVEL_MAX) return "max";
  if (wanted < 0) return "min";
  return null;
}

export function planLevel(from: number, change: LevelChange): LevelPlan {
  const wanted = wantedLevel(from, change);
  const to = clamp(wanted);
  if (to === from) return { kind: "unchanged", level: from };
  return { kind: "move", from, to, clamped: clampedEdge(wanted) };
}

// The brightness keys only step, so a level is reached from the bottom: all the way down, then up.
export function brightnessKeyPresses(change: LevelChange): KeyPress[] {
  if (change.action === "set") {
    const level = clamp(change.percent ?? 0);
    const up = Math.round(level / KEY_STEP_PERCENT);
    return [
      { direction: "down", presses: BRIGHTNESS_KEY_STEPS },
      { direction: "up", presses: up },
    ];
  }
  const step = change.percent ?? DEFAULT_STEP;
  const presses = Math.max(1, Math.round(step / KEY_STEP_PERCENT));
  return [{ direction: change.action, presses }];
}
