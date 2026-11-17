import { MAX_SCREEN_LABEL_CHARS, MAX_SCREEN_LABELS } from "@getahoy/protocol";
import { isControl, type ScreenElement, shownLabel } from "./screenElement.ts";

// A tab's label is its page title, which never goes to the AI.
const TAB_SUBROLE = "AXTabButton";

// Labels only: labelOf reads title, description, placeholder and help, never a field's value.
export function screenLabels(elements: readonly ScreenElement[]): string[] {
  const labels = elements.flatMap((element) => {
    if (!element.enabled || !isControl(element)) return [];
    if (element.subrole === TAB_SUBROLE) return [];
    const label = shownLabel(element);
    if (!label || label.length > MAX_SCREEN_LABEL_CHARS) return [];
    return [label];
  });
  return [...new Set(labels)].slice(0, MAX_SCREEN_LABELS);
}

export function onScreen(label: string, labels: readonly string[]): boolean {
  const wanted = label.trim().toLowerCase();
  return labels.some((shown) => shown.toLowerCase() === wanted);
}
