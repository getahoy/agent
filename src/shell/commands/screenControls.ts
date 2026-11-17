import type { HelperClient } from "../../core/helper/helperClient.ts";
import { screenLabels } from "../../core/resolver/screenLabels.ts";
import {
  type ScreenState,
  sameScreen,
} from "../../core/resolver/stableTarget.ts";
import {
  type BlockedApp,
  isBlockedApp,
} from "../../core/safety/blockedApps.ts";
import { frontBundleId } from "./frontApp.ts";
import { takeScreen } from "./pickedClick.ts";

export type StartScreen = {
  labels: readonly string[];
  state: ScreenState | null;
};

const NOTHING_SEEN: StartScreen = { labels: [], state: null };

// A blocked or unknown app sends nothing: its commands stay refused and its screen stays here.
export async function screenAtStart(
  helper: HelperClient,
  blockedApps: readonly BlockedApp[],
): Promise<StartScreen> {
  const front = await frontBundleId();
  if (!front || isBlockedApp(front, blockedApps)) return NOTHING_SEEN;
  const screen = await takeScreen(helper);
  if (!screen) return NOTHING_SEEN;
  return { labels: screenLabels(screen.before.elements), state: screen.before };
}

export async function stillSameScreen(
  helper: HelperClient,
  start: ScreenState | null,
): Promise<boolean> {
  if (!start) return true;
  const now = await takeScreen(helper);
  return now !== null && sameScreen(start, now.before);
}
