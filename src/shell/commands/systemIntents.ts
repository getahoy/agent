import type { ScrollAmount } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import { systemCopy } from "../../copy/systemCopy.ts";
import {
  type CommandOutcome,
  failed,
  quietly,
} from "../../core/commands/commandLog.ts";
import type { MacAction, RunnableIntent } from "../../core/commands/intent.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import type {
  HelperOutcome,
  HelperVerb,
  Modifier,
} from "../../core/helper/helperProtocol.ts";
import { runBrightness, runVolume } from "./levelIntents.ts";

type SystemIntent = MacAction | { kind: "lock" };

const SYSTEM_KINDS: Readonly<Record<SystemIntent["kind"], true>> = {
  scroll: true,
  navigate: true,
  media: true,
  volume: true,
  brightness: true,
  window: true,
  lock: true,
};

export function isSystemIntent(intent: RunnableIntent): intent is SystemIntent {
  return Object.hasOwn(SYSTEM_KINDS, intent.kind);
}

const MAX_SCROLL_TIMES = 10;
const WINDOW_HEIGHTS: Readonly<Record<ScrollAmount, number>> = {
  small: 0.1,
  page: 0.8,
  large: 2.4,
};
const NAVIGATE_KEYS = { back: "[", forward: "]", reload: "r" } as const;
const COMMAND: readonly Modifier[] = ["command"];
const LOCK_MODIFIERS: readonly Modifier[] = ["control", "command"];

function replied<Verb extends HelperVerb>(
  outcome: HelperOutcome<Verb>,
  success: (output: HelperOutcome<Verb> & { ok: true }) => CommandOutcome,
): CommandOutcome {
  if (outcome.ok) return success(outcome);
  const { code } = outcome.error;
  if (code === "no_focused_window") return failed(systemCopy.noWindow);
  if (code === "not_resizable") return failed(systemCopy.notResizable);
  if (code === "one_display") return failed(systemCopy.oneScreen);
  return failed(commandCopy.failed);
}

async function scroll(
  intent: Extract<MacAction, { kind: "scroll" }>,
  helper: HelperClient,
): Promise<CommandOutcome> {
  const { direction, amount } = intent;
  if (direction === "top" || direction === "bottom") {
    const key = direction === "top" ? "up" : "down";
    const pressed = await helper.request("key", { key, modifiers: COMMAND });
    return replied(pressed, () => quietly(systemCopy.atEdge(direction)));
  }
  const times = Math.min(MAX_SCROLL_TIMES, Math.max(1, intent.times));
  const windowHeights = WINDOW_HEIGHTS[amount] * times;
  const scrolled = await helper.request("scroll", { direction, windowHeights });
  const line = systemCopy.scrolled(direction, amount, times);
  return replied(scrolled, () => quietly(line));
}

export async function runSystemIntent(
  intent: SystemIntent,
  helper: HelperClient,
): Promise<CommandOutcome> {
  switch (intent.kind) {
    case "scroll":
      return scroll(intent, helper);
    case "navigate": {
      const key = NAVIGATE_KEYS[intent.to];
      const pressed = await helper.request("key", { key, modifiers: COMMAND });
      return replied(pressed, () => quietly(systemCopy.navigated[intent.to]));
    }
    case "volume":
      return runVolume(intent);
    case "brightness":
      return runBrightness(intent, helper);
    case "media": {
      const key = intent.action;
      const pressed = await helper.request("systemKey", { key });
      return replied(pressed, () => quietly(systemCopy.media[key]));
    }
    case "window": {
      const { action } = intent;
      const moved = await helper.request("window", { action });
      return replied(moved, ({ output }) =>
        quietly(systemCopy.arranged(action, output.app)),
      );
    }
    case "lock": {
      const modifiers = LOCK_MODIFIERS;
      const pressed = await helper.request("key", { key: "q", modifiers });
      return replied(pressed, () => quietly(systemCopy.locked));
    }
    default: {
      const unhandled: never = intent;
      throw new Error(`Unhandled system intent ${JSON.stringify(unhandled)}`);
    }
  }
}
