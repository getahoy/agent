import {
  type Frame,
  pressable,
  type ScreenElement,
  subroleName,
  textsOf,
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

function centerInside(frame: Frame, area: Frame): boolean {
  const centerX = frame.x + frame.width / 2;
  const centerY = frame.y + frame.height / 2;
  return (
    centerX >= area.x &&
    centerX <= area.x + area.width &&
    centerY >= area.y &&
    centerY <= area.y + area.height
  );
}

// An element scrolled out of its scroll area is still inside the window, so check both.
export function usableElements(
  elements: readonly ScreenElement[],
  window: Frame,
): ScreenElement[] {
  return elements.filter(({ enabled, frame, clip }) => {
    if (!enabled || !frame || frame.width <= 0 || frame.height <= 0) {
      return false;
    }
    return centerInside(frame, window) && (!clip || centerInside(frame, clip));
  });
}

export function fieldsOf(element: ScreenElement): string[] {
  return [...textsOf(element), element.subrole, subroleName(element)]
    .flatMap((field) => (field ? [normaliseLabel(field)] : []))
    .filter((field) => field !== "");
}

// A titled group and the button inside it match together: the button is the one to press.
function preferPressable(found: readonly ScreenElement[]): ScreenElement[] {
  const pressed = found.filter(pressable);
  return pressed.length > 0 ? pressed : [...found];
}

function onePerFrame(found: readonly ScreenElement[]): ScreenElement[] {
  const byFrame = new Map<string, ScreenElement>();
  for (const element of found) {
    const key = JSON.stringify(element.frame);
    if (!byFrame.has(key)) byFrame.set(key, element);
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
    const distinct = onePerFrame(preferPressable(found));
    const [only] = distinct;
    if (distinct.length === 1 && only) return { kind: "one", target: only };
    if (distinct.length > 1) return { kind: "many", targets: distinct };
  }
  return { kind: "none" };
}
