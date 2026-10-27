import assert from "node:assert/strict";
import { test } from "node:test";
import { type BrowserTab, matchTabs } from "./matchTabs.ts";

const tab = (
  window: number,
  index: number,
  title: string,
  url: string,
): BrowserTab => ({
  window,
  tab: index,
  title,
  url,
});

const TABS = [
  tab(0, 0, "Grok – Chat", "https://grok.com/chat"),
  tab(0, 1, "Inbox (3) - Gmail", "https://mail.google.com/mail/u/0/#inbox"),
  tab(1, 0, "Hacker News", "https://news.ycombinator.com/"),
  tab(1, 1, "Grok docs", "https://docs.x.ai/grok"),
];

test("one match by title, case-insensitive, across windows", () => {
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
});

test("several matches are all returned and nothing is chosen", () => {
  assert.deepEqual(matchTabs(TABS, "grok"), {
    kind: "many",
    tabs: [TABS[0], TABS[3]],
  });
});

test("no match and an empty match find nothing", () => {
  assert.deepEqual(matchTabs(TABS, "youtube"), { kind: "none" });
  assert.deepEqual(matchTabs(TABS, "  "), { kind: "none" });
});
