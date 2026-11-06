import { setTimeout as sleep } from "node:timers/promises";
import { MAX_CHOICE_LABEL_CHARS, MAX_CHOICES } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import {
  because,
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
import { sameScreen, stillThere } from "../../core/resolver/stableTarget.ts";
import type { SpeechCase } from "../../core/voice/buildSpeech.ts";
import { nounsFor } from "../../core/voice/spokenWords.ts";
import { SCREEN_CHANGED } from "./choiceBook.ts";
import {
  clickPicked,
  type OfferKind,
  type OfferTargets,
  type Screen,
  takeScreen,
} from "./pickedClick.ts";

// Two snapshots this far apart must agree before anything is clicked.
const SETTLE_MS = 100;

const NONE_CHOSEN = spoken(done(commandCopy.noneChosen), { kind: "cancelled" });

const labelText = (target: ScreenElement) => labelOf(target) ?? "";

async function clickSafely({ helper, before }: Screen, target: ScreenElement) {
  await sleep(SETTLE_MS);
  const after = (await takeScreen(helper))?.before ?? null;
  const current = after && stillThere(target, after.elements);
  if (!after || !current || !sameScreen(before, after)) {
    return SCREEN_CHANGED;
  }
  const clicked = await helper.request("click", { ref: current.ref });
  if (!clicked.ok) return failed(commandCopy.failed);
  return done(commandCopy.clicked(labelText(target)));
}

type Words = { message: string; speech: SpeechCase | null };

function offerWords(kind: OfferKind, label: string): Words {
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

function optionsFor(shown: readonly ScreenElement[], confirm: boolean) {
  const options = shown.map((target, index) => ({
    number: index + 1,
    label: labelText(target).slice(0, MAX_CHOICE_LABEL_CHARS),
  }));
  if (confirm) return options;
  const none = { number: shown.length + 1, label: commandCopy.noneOfThese };
  return [...options, none];
}

const offerTargets: OfferTargets = async (screen, targets, offer) => {
  const confirm = offer.kind === "confirm";
  const shown = targets.slice(0, confirm ? MAX_CHOICES : MAX_CHOICES - 1);
  const marks = shown.flatMap((target, index) =>
    target.frame ? [{ number: index + 1, frame: target.frame }] : [],
  );
  await screen.helper.request("overlay", { marks });
  const options = optionsFor(shown, confirm);
  const { window } = screen.before;
  const areas = shown.map((target) =>
    target.frame ? elementArea(target.frame, window) : null,
  );
  const pick = (number: number) => {
    const target = shown[number - 1];
    if (!target) return Promise.resolve(NONE_CHOSEN);
    const kind = confirm ? "confirmed" : "chosen";
    return clickPicked(screen, target, kind, offerTargets);
  };
  const destructive = confirm || shown.some(isDestructiveElement);
  const choiceAreas = [...areas, ...(confirm ? [] : [null])];
  const choice = { options, areas: choiceAreas, confirm, destructive, pick };
  const words = offerWords(offer.kind, offer.label);
  const nouns = nounsFor(shown.map((target) => target.role));
  const { label } = offer;
  const choices = { kind: "choices", label, nouns, areas } as const;
  const speech = words.speech ?? choices;
  return { status: "needsChoice", message: words.message, choice, speech };
};

function clickOrConfirm(screen: Screen, target: ScreenElement) {
  if (!isDestructiveElement(target)) return clickSafely(screen, target);
  const label = labelText(target);
  return offerTargets(screen, [target], { kind: "confirm", label });
}

export async function runClick(
  label: string,
  helper: HelperClient,
): Promise<CommandOutcome> {
  const screen = await takeScreen(helper);
  if (!screen) return because(failed(commandCopy.noWindow), "nothingSelected");
  const { before } = screen;
  const found = resolveTarget(before.elements, before.window, label);
  if (found.kind === "one") return clickOrConfirm(screen, found.target);
  if (found.kind === "many") {
    return offerTargets(screen, found.targets, { kind: "many", label });
  }
  const near = nearestTargets(before.elements, before.window, label);
  if (near.length > 0) {
    return offerTargets(screen, near, { kind: "near", label });
  }
  const missing = because(
    failed(commandCopy.noTarget(label)),
    "targetNotFound",
  );
  return spoken(missing, { kind: "notFound", label });
}
