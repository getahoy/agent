import { setTimeout as sleep } from "node:timers/promises";
import { MAX_CHOICE_LABEL_CHARS, MAX_CHOICES } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import type { CommandOutcome } from "../../core/commands/commandLog.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import type { Snapshot } from "../../core/helper/helperProtocol.ts";
import { isDestructive } from "../../core/resolver/destructiveLabels.ts";
import {
  missCandidates,
  resolveTarget,
} from "../../core/resolver/resolveTarget.ts";
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

type Offer = { message: string; confirm: boolean };

function failed(message: string): CommandOutcome {
  return { status: "failed", message };
}

function screenOf(snapshot: Snapshot): ScreenState {
  const { app, window, elements } = snapshot;
  return { appPid: app.pid, window: window.frame, elements };
}

export async function takeScreen(
  helper: HelperClient,
): Promise<ScreenState | null> {
  const snapshot = await helper.request("snapshot", {});
  return snapshot.ok ? screenOf(snapshot.output) : null;
}

export async function clickSafely(
  helper: HelperClient,
  before: ScreenState,
  target: ScreenElement,
): Promise<CommandOutcome> {
  await sleep(SETTLE_MS);
  const after = await takeScreen(helper);
  const current = after && stillThere(target, after.elements);
  if (!after || !current || !sameScreen(before, after)) {
    return failed(commandCopy.screenChanged);
  }
  const clicked = await helper.request("click", { ref: current.ref });
  if (!clicked.ok) return failed(commandCopy.failed);
  const message = commandCopy.clicked(labelOf(target) ?? "");
  return { status: "done", message };
}

export async function offerTargets(
  helper: HelperClient,
  before: ScreenState,
  targets: readonly ScreenElement[],
  offer: Offer,
): Promise<CommandOutcome> {
  const shown = targets.slice(0, MAX_CHOICES);
  const marks = shown.flatMap((target, index) =>
    target.frame ? [{ number: index + 1, frame: target.frame }] : [],
  );
  await helper.request("overlay", { marks });
  const options = shown.map((target, index) => ({
    number: index + 1,
    label: (labelOf(target) ?? "").slice(0, MAX_CHOICE_LABEL_CHARS),
  }));
  const pick = (number: number) => {
    const target = shown[number - 1];
    if (!target) return Promise.resolve(failed(commandCopy.screenChanged));
    if (!offer.confirm && isDestructive(labelOf(target) ?? "")) {
      return confirmFirst(helper, before, target);
    }
    return clickSafely(helper, before, target);
  };
  const choice = { options, confirm: offer.confirm, pick };
  return { status: "needsChoice", message: offer.message, choice };
}

function confirmFirst(
  helper: HelperClient,
  before: ScreenState,
  target: ScreenElement,
): Promise<CommandOutcome> {
  const message = commandCopy.confirmTarget(labelOf(target) ?? "");
  return offerTargets(helper, before, [target], { message, confirm: true });
}

export async function runClick(
  label: string,
  helper: HelperClient,
): Promise<CommandOutcome> {
  const before = await takeScreen(helper);
  if (!before) return failed(commandCopy.noWindow);
  const found = resolveTarget(before.elements, before.window, label);
  if (found.kind === "many") {
    const offer = { message: commandCopy.manyTargets(label), confirm: false };
    return offerTargets(helper, before, found.targets, offer);
  }
  if (found.kind === "one") {
    const { target } = found;
    if (isDestructive(labelOf(target) ?? "")) {
      return confirmFirst(helper, before, target);
    }
    return clickSafely(helper, before, target);
  }
  const near = missCandidates(before.elements, before.window, MAX_CHOICES);
  if (near.length === 0) return failed(commandCopy.noTarget(label));
  const message = commandCopy.missedTarget(label);
  return offerTargets(helper, before, near, { message, confirm: false });
}
