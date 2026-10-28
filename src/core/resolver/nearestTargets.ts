import { fieldsOf, normaliseLabel, usableElements } from "./resolveTarget.ts";
import {
  type Frame,
  PRESS_ACTION,
  type ScreenElement,
} from "./screenElement.ts";

export const MAX_NEAREST = 9;
// Below this a label shares too few letter pairs with what was said to be worth a number.
export const CLOSE_ENOUGH = 0.5;

function letterPairs(text: string): string[] {
  const letters = text.replace(/\s+/g, "");
  return Array.from({ length: Math.max(letters.length - 1, 0) }, (_, at) =>
    letters.slice(at, at + 2),
  );
}

export function similarity(first: string, second: string): number {
  const pairs = letterPairs(first);
  const others = letterPairs(second);
  if (pairs.length === 0 || others.length === 0) {
    return first === second ? 1 : 0;
  }
  const remaining = [...others];
  let shared = 0;
  for (const pair of pairs) {
    const at = remaining.indexOf(pair);
    if (at === -1) continue;
    shared += 1;
    remaining.splice(at, 1);
  }
  return (2 * shared) / (pairs.length + others.length);
}

// A match on one word of a longer label ranks just below the same match on the whole label.
const WORD_WEIGHT = 0.9;

function closeness(element: ScreenElement, wanted: string): number {
  const scores = fieldsOf(element).flatMap((field) => [
    similarity(wanted, field),
    ...field.split(" ").map((word) => WORD_WEIGHT * similarity(wanted, word)),
  ]);
  return Math.max(0, ...scores);
}

export function nearestTargets(
  elements: readonly ScreenElement[],
  window: Frame,
  label: string,
): ScreenElement[] {
  const wanted = normaliseLabel(label);
  if (wanted === "") return [];
  return usableElements(elements, window)
    .filter((element) => element.actions.includes(PRESS_ACTION))
    .map((element) => ({ element, score: closeness(element, wanted) }))
    .filter(({ score }) => score >= CLOSE_ENOUGH)
    .sort((first, second) => second.score - first.score)
    .slice(0, MAX_NEAREST)
    .map(({ element }) => element);
}
