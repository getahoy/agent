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

// Live pages add and remove elements all the time, so only the app and window must hold still.
export function sameScreen(before: ScreenState, after: ScreenState): boolean {
  return (
    before.appPid === after.appPid && sameFrame(before.window, after.window)
  );
}

export function stillThere(
  target: ScreenElement,
  elements: readonly ScreenElement[],
): ScreenElement | null {
  const label = labelOf(target);
  const place = target.frame;
  if (!place) return null;
  const found = elements.find(
    (element) =>
      element.enabled &&
      labelOf(element) === label &&
      element.frame !== undefined &&
      sameFrame(element.frame, place),
  );
  return found ?? null;
}
