import type { Intent } from "../../core/commands/intent.ts";
import { actsOnScreen } from "../../core/commands/screenActions.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import type { ScreenState } from "../../core/resolver/stableTarget.ts";
import { stillSameScreen } from "./screenControls.ts";

const LATE_ANSWER_MS = 4000;

// The AI call goes on after a cancel, but its answer is no longer waited for or used.
export function unlessCancelled<Answer>(
  work: Promise<Answer>,
  cancel: AbortSignal,
): Promise<Answer | null> {
  if (cancel.aborted) return Promise.resolve(null);
  return new Promise((resolve) => {
    cancel.addEventListener("abort", () => resolve(null), { once: true });
    void work.then(resolve);
  });
}

type LateCheck = {
  intents: readonly Intent[];
  startedAt: number;
  helper: HelperClient;
  start: ScreenState | null;
};

// By the time a slow answer lands the person may be in another window, which must not be acted on.
export async function screenMovedOn(check: LateCheck): Promise<boolean> {
  if (Date.now() - check.startedAt <= LATE_ANSWER_MS) return false;
  if (!check.intents.some(actsOnScreen)) return false;
  return !(await stillSameScreen(check.helper, check.start));
}
