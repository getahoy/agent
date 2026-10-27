import { commandCopy } from "../../copy/commandCopy.ts";
import type { CommandOutcome } from "../../core/commands/commandLog.ts";
import type { TabIntent } from "../../core/commands/intent.ts";
import { matchTabs } from "../../core/commands/matchTabs.ts";
import {
  actOnTab,
  type BrowserFamily,
  defaultBrowser,
  listTabs,
  type TabList,
} from "./browserScripts.ts";
import { frontApp } from "./frontApp.ts";
import type { ScriptAnswer } from "./osaScript.ts";

const TAB_BROWSERS = new Map<string, BrowserFamily>([
  ["Google Chrome", "chromium"],
  ["Brave Browser", "chromium"],
  ["Microsoft Edge", "chromium"],
  ["Arc", "arc"],
  ["Safari", "safari"],
]);

function failed(message: string): CommandOutcome {
  return { status: "failed", message };
}

type Stopped =
  | Exclude<TabList, { kind: "tabs" }>
  | Exclude<ScriptAnswer, { kind: "answered" }>;

function stopped(answer: Stopped, browser: string): CommandOutcome {
  switch (answer.kind) {
    case "notAllowed":
      return failed(commandCopy.allowControl(browser));
    case "notRunning":
      return failed(commandCopy.notOpen(browser));
    case "timedOut":
      return failed(commandCopy.failed);
    default: {
      const unhandled: never = answer;
      throw new Error(`Unhandled tab answer ${JSON.stringify(unhandled)}`);
    }
  }
}

async function targetBrowser(named: string | null): Promise<string | null> {
  if (named) return named;
  const front = await frontApp();
  if (front && TAB_BROWSERS.has(front)) return front;
  return defaultBrowser();
}

function actedMessage(intent: TabIntent): string {
  return intent.kind === "closeTab"
    ? commandCopy.closedTab(intent.match)
    : commandCopy.switchedTab(intent.match);
}

export async function runTabIntent(intent: TabIntent): Promise<CommandOutcome> {
  const browser = await targetBrowser(intent.browser);
  const family = browser ? TAB_BROWSERS.get(browser) : undefined;
  if (!browser || !family) return failed(commandCopy.noTabControl(browser));
  const list = await listTabs(browser, family);
  if (list.kind !== "tabs") return stopped(list, browser);
  const found = matchTabs(list.tabs, intent.match);
  if (found.kind === "none") {
    return failed(commandCopy.noTab(intent.match, browser));
  }
  if (found.kind === "many") {
    const titles = found.tabs.map((tab) => tab.title);
    return { status: "needsChoice", message: commandCopy.manyTabs(titles) };
  }
  const action = intent.kind === "closeTab" ? "close" : "switch";
  const acted = await actOnTab(browser, family, action, found.tab);
  if (acted.kind !== "answered") return stopped(acted, browser);
  return { status: "done", message: actedMessage(intent) };
}
