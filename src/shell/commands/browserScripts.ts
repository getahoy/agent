import { z } from "zod";
import type { BrowserTab } from "../../core/commands/matchTabs.ts";
import { osaScript, type ScriptAnswer } from "./osaScript.ts";

export type BrowserFamily = "chromium" | "arc" | "safari";
export type TabAction = "close" | "switch";

const NOT_RUNNING = "null";

// Arc throws on tabs() but answers indexed access, so every browser is read by index.
const LIST_TABS = [
  "function run(argv) {",
  "  const app = Application(argv[0]);",
  `  if (!app.running()) return "${NOT_RUNNING}";`,
  '  const titled = argv[1] === "safari" ? "name" : "title";',
  "  const tabs = [];",
  "  for (let w = 0; w < app.windows.length; w++) {",
  "    const win = app.windows[w];",
  "    let count = 0;",
  "    try { count = win.tabs.length; } catch (error) { count = 0; }",
  "    for (let t = 0; t < count; t++) {",
  "      const tab = win.tabs[t];",
  '      let title = "";',
  '      let url = "";',
  '      try { title = tab[titled]() || ""; } catch (error) { title = ""; }',
  '      try { url = tab.url() || ""; } catch (error) { url = ""; }',
  "      tabs.push({ window: w, tab: t, title, url });",
  "    }",
  "  }",
  "  return JSON.stringify(tabs);",
  "}",
];

const ACT_ON_TAB = [
  "function run(argv) {",
  "  const app = Application(argv[0]);",
  "  const win = app.windows[Number(argv[3])];",
  "  const tab = win.tabs[Number(argv[4])];",
  '  if (argv[2] === "close") { tab.close(); return "done"; }',
  '  if (argv[1] === "safari") win.currentTab = tab;',
  '  else if (argv[1] === "arc") tab.select();',
  "  else win.activeTabIndex = Number(argv[4]) + 1;",
  "  try { win.index = 1; } catch (error) {}",
  "  app.activate();",
  '  return "done";',
  "}",
];

const tabListSchema = z.array(
  z.object({
    window: z.int(),
    tab: z.int(),
    title: z.string(),
    url: z.string(),
  }),
);

export type TabList =
  | { kind: "tabs"; tabs: BrowserTab[] }
  | { kind: "notRunning" }
  | Exclude<ScriptAnswer, { kind: "answered" }>;

function parseTabs(answer: string, browser: string): TabList {
  if (answer === NOT_RUNNING) return { kind: "notRunning" };
  const parsed = tabListSchema.safeParse(JSON.parse(answer));
  if (!parsed.success) {
    throw new Error("Browser returned an unreadable tab list");
  }
  const tabs = parsed.data.map((tab) => ({ ...tab, browser }));
  return { kind: "tabs", tabs };
}

export async function listTabs(
  browser: string,
  family: BrowserFamily,
): Promise<TabList> {
  const script = await osaScript("JavaScript", LIST_TABS, [browser, family]);
  if (script.kind !== "answered") return script;
  return parseTabs(script.answer, browser);
}

export function actOnTab(
  family: BrowserFamily,
  action: TabAction,
  tab: BrowserTab,
): Promise<ScriptAnswer> {
  const where = [String(tab.window), String(tab.tab)];
  const args = [tab.browser, family, action, ...where];
  return osaScript("JavaScript", ACT_ON_TAB, args);
}
