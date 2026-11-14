import type { ScrollAmount } from "@getahoy/protocol";
import type {
  AgainIntent,
  MacAction,
  RunnableIntent,
  StepScale,
} from "./intent.ts";
import { DEFAULT_STEP, LITTLE_STEP, LOT_STEP } from "./levelChange.ts";

export const STEP_MEMORY_MS = 60_000;

const SCROLL_ORDER: readonly ScrollAmount[] = ["small", "page", "large"];
const SCROLL_SHIFT: Readonly<Record<StepScale, number>> = {
  small: -1,
  normal: 0,
  large: 1,
};
const LEVEL_SCALE: Readonly<Record<StepScale, number>> = {
  small: 0.5,
  normal: 1,
  large: 2,
};
const TOWARD_STEPS: Readonly<Record<StepScale, number>> = {
  small: LITTLE_STEP,
  normal: DEFAULT_STEP,
  large: LOT_STEP,
};

type ScrollStep = Extract<MacAction, { kind: "scroll" }>;
type LevelStep = Extract<MacAction, { kind: "volume" | "brightness" }>;
type Step = ScrollStep | LevelStep;

export type LastStep = { step: Step; at: number };

export function rememberStep(
  intent: RunnableIntent,
  at: number,
): LastStep | null {
  if (intent.kind === "scroll") {
    const moving = intent.direction === "up" || intent.direction === "down";
    return moving ? { step: intent, at } : null;
  }
  if (intent.kind !== "volume" && intent.kind !== "brightness") return null;
  if (intent.action !== "up" && intent.action !== "down") return null;
  return { step: { ...intent, percent: intent.percent ?? DEFAULT_STEP }, at };
}

function scaledScroll(step: ScrollStep, scale: StepScale): ScrollStep {
  const index = SCROLL_ORDER.indexOf(step.amount) + SCROLL_SHIFT[scale];
  const bounded = Math.min(SCROLL_ORDER.length - 1, Math.max(0, index));
  return { ...step, amount: SCROLL_ORDER[bounded] ?? step.amount };
}

function scaledLevel(step: LevelStep, scale: StepScale): LevelStep {
  const percent = (step.percent ?? DEFAULT_STEP) * LEVEL_SCALE[scale];
  return { ...step, percent: Math.max(1, Math.round(percent)) };
}

export function repeatStep(
  last: LastStep | null,
  again: AgainIntent,
  now: number,
): RunnableIntent | null {
  const fresh = last && now - last.at <= STEP_MEMORY_MS ? last.step : null;
  if (again.toward) {
    const percent =
      fresh?.kind === "volume"
        ? scaledLevel(fresh, again.amount).percent
        : TOWARD_STEPS[again.amount];
    return { kind: "volume", action: again.toward, percent };
  }
  if (!fresh) return null;
  if (fresh.kind === "scroll") return scaledScroll(fresh, again.amount);
  return scaledLevel(fresh, again.amount);
}
