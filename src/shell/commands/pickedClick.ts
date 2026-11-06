import { commandCopy } from "../../copy/commandCopy.ts";
import {
  because,
  type CommandOutcome,
  done,
  failed,
} from "../../core/commands/commandLog.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import {
  type PickKind,
  refindTarget,
  type SeenApp,
} from "../../core/resolver/refindTarget.ts";
import {
  labelOf,
  type ScreenElement,
} from "../../core/resolver/screenElement.ts";
import type { ScreenState } from "../../core/resolver/stableTarget.ts";

export type Screen = {
  helper: HelperClient;
  before: ScreenState;
  app: SeenApp;
};

export type OfferKind = "many" | "near" | "confirm";

export type OfferTargets = (
  screen: Screen,
  targets: readonly ScreenElement[],
  offer: { kind: OfferKind; label: string },
) => Promise<CommandOutcome>;

export async function takeScreen(helper: HelperClient): Promise<Screen | null> {
  const snapshot = await helper.request("snapshot", {});
  if (!snapshot.ok) return null;
  const { app, window, elements } = snapshot.output;
  const before = { appPid: app.pid, window: window.frame, elements };
  return { helper, before, app: { pid: app.pid, name: app.name } };
}

const labelText = (target: ScreenElement) => labelOf(target) ?? "";

function gone(label: string): CommandOutcome {
  return because(failed(commandCopy.targetGone(label)), "screenChanged");
}

// The overlay was cleared when the pick closed the choice; a fresh offer draws its own.
export async function clickPicked(
  screen: Screen,
  target: ScreenElement,
  pick: PickKind,
  offerTargets: OfferTargets,
): Promise<CommandOutcome> {
  const label = labelText(target);
  const fresh = await takeScreen(screen.helper);
  if (!fresh) return gone(label);
  const was = screen.app;
  const now = fresh.app;
  const { elements } = fresh.before;
  const found = refindTarget({ target, pick, was, now, elements });
  switch (found.kind) {
    case "click": {
      const clicked = await fresh.helper.request("click", {
        ref: found.element.ref,
      });
      if (!clicked.ok) return failed(commandCopy.failed);
      return done(commandCopy.clicked(label));
    }
    case "confirm":
      return offerTargets(fresh, [found.element], { kind: "confirm", label });
    case "offer":
      return offerTargets(fresh, found.elements, { kind: "many", label });
    case "gone":
      return gone(label);
    case "otherApp": {
      const elsewhere = failed(commandCopy.otherApp(found.now, found.was));
      return because(elsewhere, "screenChanged");
    }
    default: {
      const unhandled: never = found;
      return unhandled;
    }
  }
}
