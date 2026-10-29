import { setTimeout as sleep } from "node:timers/promises";
import { MAX_CHOICE_LABEL_CHARS, MAX_CHOICES } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import {
  type CommandOutcome,
  done,
  failed,
  spoken,
} from "../../core/commands/commandLog.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import { isDestructiveElement } from "../../core/resolver/destructiveLabels.ts";
import { elementArea } from "../../core/resolver/elementArea.ts";
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
import type { SpeechCase } from "../../core/voice/buildSpeech.ts";
import { nounsFor } from "../../core/voice/spokenWords.ts";

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
    return spoken(failed(commandCopy.screenChanged), SCREEN_CHANGED);
  }
  const clicked = await helper.request("click", { ref: current.ref });
  if (!clicked.ok) return failed(commandCopy.failed);
  return done(commandCopy.clicked(labelText(target)));
}

const SCREEN_CHANGED: SpeechCase = { kind: "screenChanged" };

type Offer = { kind: "many" | "near" | "confirm"; label: string };

type Words = { message: string; speech: SpeechCase | null };

function offerWords({ kind, label }: Offer): Words {
  switch (kind) {
    case "many":
      return { message: commandCopy.manyTargets(label), speech: null };
    case "near":
      return {
        message: commandCopy.missedTarget(label),
        speech: { kind: "nearMiss", label },
      };
    case "confirm":
      return {
        message: commandCopy.confirmTarget(label),
        speech: { kind: "confirm", button: label },
      };
    default: {
      const unhandled: never = kind;
      throw new Error(`Unhandled offer ${unhandled}`);
    }
  }
}

async function offerTargets(
  screen: Screen,
  targets: readonly ScreenElement[],
  offer: Offer,
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
  const { window } = screen.before;
  const areas = shown.map((target) =>
    target.frame ? elementArea(target.frame, window) : null,
  );
  const confirm = offer.kind === "confirm";
  const pick = (number: number) => {
    const target = shown[number - 1];
    if (!target) return Promise.resolve(failed(commandCopy.screenChanged));
    const act = confirm ? clickSafely : clickOrConfirm;
    return act(screen, target);
  };
  const destructive = confirm || shown.some(isDestructiveElement);
  const choice = { options, areas, confirm, destructive, pick };
  const words = offerWords(offer);
  const nouns = nounsFor(shown.map((target) => target.role));
  const speech = words.speech ?? {
    kind: "choices",
    label: offer.label,
    nouns,
    areas,
  };
  return { status: "needsChoice", message: words.message, choice, speech };
}

function clickOrConfirm(screen: Screen, target: ScreenElement) {
  if (!isDestructiveElement(target)) return clickSafely(screen, target);
  const label = labelText(target);
  return offerTargets(screen, [target], { kind: "confirm", label });
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
    return offerTargets(screen, found.targets, { kind: "many", label });
  }
  const near = nearestTargets(before.elements, before.window, label);
  if (near.length > 0) {
    return offerTargets(screen, near, { kind: "near", label });
  }
  const missing = failed(commandCopy.noTarget(label));
  return spoken(missing, { kind: "notFound", label });
}
