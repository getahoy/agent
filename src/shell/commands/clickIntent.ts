import { setTimeout as sleep } from "node:timers/promises";
import { MAX_CHOICE_LABEL_CHARS, MAX_CHOICES } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import {
  type CommandOutcome,
  done,
  failed,
} from "../../core/commands/commandLog.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import { isDestructiveElement } from "../../core/resolver/destructiveLabels.ts";
import { nearestTargets } from "../../core/resolver/nearestTargets.ts";
import { resolveTarget } from "../../core/resolver/resolveTarget.ts";
import {
  labelOf,
  type ScreenElement,
} from "../../core/resolver/screenElement.ts";
import {
  type ScreenState,
  sameScreen,
  stillThere,
} from "../../core/resolver/stableTarget.ts";

// Two snapshots this far apart must agree before anything is clicked.
const SETTLE_MS = 100;

type Screen = { helper: HelperClient; before: ScreenState };

async function takeScreen(helper: HelperClient): Promise<ScreenState | null> {
  const snapshot = await helper.request("snapshot", {});
  if (!snapshot.ok) return null;
  const { app, window, elements } = snapshot.output;
  return { appPid: app.pid, window: window.frame, elements };
}

const labelText = (target: ScreenElement) => labelOf(target) ?? "";

async function clickSafely({ helper, before }: Screen, target: ScreenElement) {
  await sleep(SETTLE_MS);
  const after = await takeScreen(helper);
  const current = after && stillThere(target, after.elements);
  if (!after || !current || !sameScreen(before, after)) {
    return failed(commandCopy.screenChanged);
  }
  const clicked = await helper.request("click", { ref: current.ref });
  if (!clicked.ok) return failed(commandCopy.failed);
  return done(commandCopy.clicked(labelText(target)));
}

async function offerTargets(
  screen: Screen,
  targets: readonly ScreenElement[],
  message: string,
  confirm: boolean,
): Promise<CommandOutcome> {
  const shown = targets.slice(0, MAX_CHOICES);
  const marks = shown.flatMap((target, index) =>
    target.frame ? [{ number: index + 1, frame: target.frame }] : [],
  );
  await screen.helper.request("overlay", { marks });
  const options = shown.map((target, index) => ({
    number: index + 1,
    label: labelText(target).slice(0, MAX_CHOICE_LABEL_CHARS),
  }));
  const pick = (number: number) => {
    const target = shown[number - 1];
    if (!target) return Promise.resolve(failed(commandCopy.screenChanged));
    const act = confirm ? clickSafely : clickOrConfirm;
    return act(screen, target);
  };
  return { status: "needsChoice", message, choice: { options, confirm, pick } };
}

function clickOrConfirm(screen: Screen, target: ScreenElement) {
  if (!isDestructiveElement(target)) return clickSafely(screen, target);
  const message = commandCopy.confirmTarget(labelText(target));
  return offerTargets(screen, [target], message, true);
}

export async function runClick(
  label: string,
  helper: HelperClient,
): Promise<CommandOutcome> {
  const before = await takeScreen(helper);
  if (!before) return failed(commandCopy.noWindow);
  const screen = { helper, before };
  const found = resolveTarget(before.elements, before.window, label);
  if (found.kind === "one") return clickOrConfirm(screen, found.target);
  if (found.kind === "many") {
    const message = commandCopy.manyTargets(label);
    return offerTargets(screen, found.targets, message, false);
  }
  const near = nearestTargets(before.elements, before.window, label);
  if (near.length === 0) return failed(commandCopy.noTarget(label));
  return offerTargets(screen, near, commandCopy.missedTarget(label), false);
}
