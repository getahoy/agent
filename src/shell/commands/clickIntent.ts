import { setTimeout as sleep } from "node:timers/promises";
import { commandCopy } from "../../copy/commandCopy.ts";
import type { CommandOutcome } from "../../core/commands/commandLog.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import type { Snapshot } from "../../core/helper/helperProtocol.ts";
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
  const label = labelOf(target) ?? "";
  const again = after && resolveTarget(after.elements, after.window, label);
  const current = again && stillThere(target, again);
  if (!after || !current || !sameScreen(before, after)) {
    return failed(commandCopy.screenChanged);
  }
  const clicked = await helper.request("click", { ref: current.ref });
  if (!clicked.ok) return failed(commandCopy.failed);
  return { status: "done", message: commandCopy.clicked(label) };
}

export async function runClick(
  label: string,
  helper: HelperClient,
): Promise<CommandOutcome> {
  const before = await takeScreen(helper);
  if (!before) return failed(commandCopy.noWindow);
  const found = resolveTarget(before.elements, before.window, label);
  if (found.kind === "none") return failed(commandCopy.noTarget(label));
  if (found.kind === "many") {
    return { status: "needsChoice", message: commandCopy.manyTargets(label) };
  }
  return clickSafely(helper, before, found.target);
}
