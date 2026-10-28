import assert from "node:assert/strict";
import { test } from "node:test";
import { type BrowserTab, matchTabs, soundKey } from "./matchTabs.ts";

const tab = (
  browser: string,
  window: number,
  title: string,
  url: string,
): BrowserTab => ({ browser, window, tab: 0, title, url });

const TABS = [
  tab("Google Chrome", 0, "Grok – Chat", "https://grok.com/chat"),
  tab("Google Chrome", 1, "Inbox (3) - Gmail", "https://mail.google.com/"),
  tab("Arc", 0, "Hacker News", "https://news.ycombinator.com/"),
  tab("Arc", 1, "Grok docs", "https://docs.x.ai/grok"),
  tab("Arc", 2, "GroqCloud", "https://console.groq.com/keys"),
];

test("one match by title, case-insensitive, across browsers", () => {
  assert.deepEqual(matchTabs(TABS, "GMAIL"), { kind: "one", tab: TABS[1] });
  assert.deepEqual(matchTabs(TABS, "hacker news"), {
    kind: "one",
    tab: TABS[2],
  });
});

test("a match can come from the url, spaces ignored", () => {
  assert.deepEqual(matchTabs(TABS, "y combinator"), {
    kind: "one",
    tab: TABS[2],
  });
  assert.deepEqual(matchTabs(TABS, "console"), { kind: "one", tab: TABS[4] });
});

test("several matches are all returned and nothing is chosen", () => {
  assert.deepEqual(matchTabs(TABS, "grok"), {
    kind: "many",
    tabs: [TABS[0], TABS[3]],
  });
});

test("a sound-alike finds the tab only when spelling finds nothing", () => {
  const groqOnly = [TABS[1], TABS[4]].flatMap((only) => (only ? [only] : []));
  assert.deepEqual(matchTabs(groqOnly, "grok"), {
    kind: "one",
    tab: TABS[4],
  });
  assert.equal(soundKey("groq"), soundKey("grok"));
  assert.notEqual(soundKey("gmail"), soundKey("grok"));
});

test("no match and an empty match find nothing", () => {
  assert.deepEqual(matchTabs(TABS, "youtube"), { kind: "none" });
  assert.deepEqual(matchTabs(TABS, "  "), { kind: "none" });
});
