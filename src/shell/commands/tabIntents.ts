import { commandCopy } from "../../copy/commandCopy.ts";
import {
  type CommandOutcome,
  done,
  failed,
} from "../../core/commands/commandLog.ts";
import type { TabIntent } from "../../core/commands/intent.ts";
import { type BrowserTab, matchTabs } from "../../core/commands/matchTabs.ts";
import {
  actOnTab,
  type BrowserFamily,
  listTabs,
  type TabList,
} from "./browserScripts.ts";
import type { ScriptAnswer } from "./osaScript.ts";

const TAB_BROWSERS = new Map<string, BrowserFamily>([
  ["Google Chrome", "chromium"],
  ["Brave Browser", "chromium"],
  ["Microsoft Edge", "chromium"],
  ["Arc", "arc"],
  ["Safari", "safari"],
]);

type Listed = { browser: string; list: TabList };

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

async function listAll(browsers: readonly string[]): Promise<Listed[]> {
  const families = browsers.flatMap((browser) => {
    const family = TAB_BROWSERS.get(browser);
    return family ? [{ browser, family }] : [];
  });
  return Promise.all(
    families.map(async ({ browser, family }) => ({
      browser,
      list: await listTabs(browser, family),
    })),
  );
}

function openTabs(listed: readonly Listed[]): BrowserTab[] {
  return listed.flatMap(({ list }) => (list.kind === "tabs" ? list.tabs : []));
}

function nothingFound(intent: TabIntent, listed: readonly Listed[]) {
  const [only] = listed;
  if (intent.browser && only && only.list.kind !== "tabs") {
    return stopped(only.list, only.browser);
  }
  const denied = listed.find(({ list }) => list.kind === "notAllowed");
  if (denied) return failed(commandCopy.allowControl(denied.browser));
  return failed(commandCopy.noTab(intent.match, intent.browser));
}

function actedMessage(intent: TabIntent): string {
  return intent.kind === "closeTab"
    ? commandCopy.closedTab(intent.match)
    : commandCopy.switchedTab(intent.match);
}

export async function runTabIntent(intent: TabIntent): Promise<CommandOutcome> {
  const named = intent.browser;
  if (named && !TAB_BROWSERS.has(named)) {
    return failed(commandCopy.noTabControl(named));
  }
  const listed = await listAll(named ? [named] : [...TAB_BROWSERS.keys()]);
  const found = matchTabs(openTabs(listed), intent.match);
  if (found.kind === "none") return nothingFound(intent, listed);
  if (found.kind === "many") {
    const titles = found.tabs.map((tab) => tab.title);
    const message = commandCopy.manyTabs(titles);
    return { status: "needsChoice", message, speech: { kind: "manyTabs" } };
  }
  const { tab } = found;
  const family = TAB_BROWSERS.get(tab.browser);
  if (!family) return failed(commandCopy.noTabControl(tab.browser));
  const action = intent.kind === "closeTab" ? "close" : "switch";
  const acted = await actOnTab(family, action, tab);
  if (acted.kind !== "answered") return stopped(acted, tab.browser);
  return done(actedMessage(intent));
}
