import type { FailureReason } from "@getahoy/protocol";
import type { CommandOutcome } from "./commandLog.ts";
import type { RunnableIntent } from "./intent.ts";

const MAIL_APP = "Mail";
const GMAIL = "Gmail";

export function failureReasonOf(
  outcome: CommandOutcome,
): FailureReason | undefined {
  switch (outcome.status) {
    case "done":
    case "needsChoice":
      return undefined;
    case "failed":
    case "refused": {
      const reason = outcome.reason ?? "other";
      return reason === "choiceExpired" ? "other" : reason;
    }
    default: {
      const unhandled: never = outcome.status;
      return unhandled;
    }
  }
}

export function appOfIntent(intent: RunnableIntent): string | null {
  switch (intent.kind) {
    case "open":
    case "quit":
    case "hide":
    case "activate":
      return intent.app;
    case "search":
    case "openSite":
    case "closeTab":
    case "switchTab":
      return intent.browser;
    case "draftEmail":
      return intent.via === "mail" ? MAIL_APP : (intent.browser ?? GMAIL);
    case "keys":
    case "type":
    case "click":
    case "scroll":
    case "navigate":
    case "media":
    case "volume":
    case "brightness":
    case "window":
    case "lock":
      return null;
    default: {
      const unhandled: never = intent;
      return unhandled;
    }
  }
}
