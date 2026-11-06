import { isDestructiveElement } from "./destructiveLabels.ts";
import { labelOf, type ScreenElement, sameFrame } from "./screenElement.ts";

export type SeenApp = { pid: number; name: string };

// A confirmed pick was already approved where it stood; a chosen one was not.
export type PickKind = "chosen" | "confirmed";

export type Refound =
  | { kind: "click"; element: ScreenElement }
  | { kind: "confirm"; element: ScreenElement }
  | { kind: "offer"; elements: ScreenElement[] }
  | { kind: "gone"; label: string }
  | { kind: "otherApp"; now: string; was: string };

type RefindInput = {
  target: ScreenElement;
  pick: PickKind;
  was: SeenApp;
  now: SeenApp;
  elements: readonly ScreenElement[];
};

function moved(target: ScreenElement, found: ScreenElement): boolean {
  if (!target.frame || !found.frame) return true;
  return !sameFrame(target.frame, found.frame);
}

type Match = { target: ScreenElement; found: ScreenElement; pick: PickKind };

function needsConfirm({ target, found, pick }: Match) {
  if (!isDestructiveElement(found)) return false;
  return pick === "chosen" || moved(target, found);
}

// Never trusts an old position or ref: the target is looked up again on a fresh snapshot.
export function refindTarget(input: RefindInput): Refound {
  const { target, pick, was, now, elements } = input;
  if (now.pid !== was.pid) {
    return { kind: "otherApp", now: now.name, was: was.name };
  }
  const label = labelOf(target);
  const matches = elements.filter(
    (element) =>
      element.enabled &&
      element.role === target.role &&
      labelOf(element) === label,
  );
  const [only] = matches;
  if (!only) return { kind: "gone", label: label ?? "" };
  if (matches.length > 1) return { kind: "offer", elements: matches };
  const confirm = needsConfirm({ target, found: only, pick });
  return { kind: confirm ? "confirm" : "click", element: only };
}
