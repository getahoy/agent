import type { Resolution } from "./resolveTarget.ts";
import {
  type Frame,
  labelOf,
  type ScreenElement,
  sameFrame,
} from "./screenElement.ts";

export type ScreenState = {
  appPid: number;
  window: Frame;
  elements: readonly ScreenElement[];
};

export function sameScreen(before: ScreenState, after: ScreenState): boolean {
  return (
    before.appPid === after.appPid &&
    sameFrame(before.window, after.window) &&
    before.elements.length === after.elements.length
  );
}

export function stillThere(
  before: ScreenElement,
  after: Resolution,
): ScreenElement | null {
  if (after.kind !== "one") return null;
  const { target } = after;
  if (labelOf(target) !== labelOf(before)) return null;
  if (!target.frame || !before.frame) return null;
  return sameFrame(target.frame, before.frame) ? target : null;
}
