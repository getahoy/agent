import { commandCopy } from "../../copy/commandCopy.ts";
import {
  because,
  type CommandOutcome,
  refused,
} from "../../core/commands/commandLog.ts";
import type { RunnableIntent } from "../../core/commands/intent.ts";
import { appOfIntent } from "../../core/commands/outcomeDetails.ts";
import type { HelperClient } from "../../core/helper/helperClient.ts";
import {
  type BlockedApp,
  isBlockedApp,
} from "../../core/safety/blockedApps.ts";
import { frontAppName, frontBundleId } from "./frontApp.ts";
import { runIntent } from "./runIntent.ts";

type Guard = { helper: HelperClient; blockedApps: readonly BlockedApp[] };

const SCREEN_INTENTS: ReadonlySet<RunnableIntent["kind"]> = new Set([
  "click",
  "keys",
  "type",
  "scroll",
]);
const FRONT_APP_INTENTS: ReadonlySet<RunnableIntent["kind"]> = new Set([
  "navigate",
  "window",
]);

export function withApp(outcome: CommandOutcome, app: string | null) {
  return app ? { ...outcome, app } : outcome;
}

// Not knowing which app is in front counts as blocked: the list must fail closed.
export async function runGuarded(
  intent: RunnableIntent,
  { helper, blockedApps }: Guard,
): Promise<CommandOutcome> {
  if (FRONT_APP_INTENTS.has(intent.kind)) {
    const frontName = await frontAppName();
    return withApp(await runIntent(intent, helper), frontName);
  }
  if (!SCREEN_INTENTS.has(intent.kind)) {
    return withApp(await runIntent(intent, helper), appOfIntent(intent));
  }
  const [front, frontName] = await Promise.all([
    frontBundleId(),
    frontAppName(),
  ]);
  if (!front || isBlockedApp(front, blockedApps)) {
    const blocked = because(refused(commandCopy.blockedApp), "blockedApp");
    return withApp(blocked, frontName);
  }
  return withApp(await runIntent(intent, helper), frontName);
}
