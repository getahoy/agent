import {
  type Frame,
  PRESS_ACTION,
  type ScreenElement,
} from "./screenElement.ts";

export type Resolution =
  | { kind: "one"; target: ScreenElement }
  | { kind: "many"; targets: readonly ScreenElement[] }
  | { kind: "none" };

type Tier = (field: string, wanted: string) => boolean;

const tiers: readonly Tier[] = [
  (field, wanted) => field === wanted,
  (field, wanted) => ` ${field} `.includes(` ${wanted} `),
  (field, wanted) => field.includes(wanted),
];

export function normaliseLabel(text: string): string {
  return text
    .toLowerCase()
    .replace(/…|\.{3}/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function insideWindow(frame: Frame, window: Frame): boolean {
  const centerX = frame.x + frame.width / 2;
  const centerY = frame.y + frame.height / 2;
  return (
    centerX >= window.x &&
    centerX <= window.x + window.width &&
    centerY >= window.y &&
    centerY <= window.y + window.height
  );
}

export function usableElements(
  elements: readonly ScreenElement[],
  window: Frame,
): ScreenElement[] {
  return elements.filter(({ enabled, frame }) => {
    if (!enabled || !frame || frame.width <= 0 || frame.height <= 0) {
      return false;
    }
    return insideWindow(frame, window);
  });
}

export function fieldsOf(element: ScreenElement): string[] {
  const { title, description, help, placeholder, subrole } = element;
  return [title, description, help, placeholder, subrole]
    .flatMap((field) => (field ? [normaliseLabel(field)] : []))
    .filter((field) => field !== "");
}

function pressable(element: ScreenElement): boolean {
  return element.actions.includes(PRESS_ACTION);
}

// A titled group and the button inside it often share one frame: keep one, the pressable one.
function withoutNestedCopies(found: readonly ScreenElement[]) {
  const byFrame = new Map<string, ScreenElement>();
  for (const element of found) {
    const key = JSON.stringify(element.frame);
    const kept = byFrame.get(key);
    if (!kept || (!pressable(kept) && pressable(element))) {
      byFrame.set(key, element);
    }
  }
  return [...byFrame.values()];
}

export function resolveTarget(
  elements: readonly ScreenElement[],
  window: Frame,
  label: string,
): Resolution {
  const wanted = normaliseLabel(label);
  if (wanted === "") return { kind: "none" };
  const usable = usableElements(elements, window);
  for (const tier of tiers) {
    const found = usable.filter((element) =>
      fieldsOf(element).some((field) => tier(field, wanted)),
    );
    const distinct = withoutNestedCopies(found);
    const [only] = distinct;
    if (distinct.length === 1 && only) return { kind: "one", target: only };
    if (distinct.length > 1) return { kind: "many", targets: distinct };
  }
  return { kind: "none" };
}
