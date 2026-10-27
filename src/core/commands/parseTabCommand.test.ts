import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCommand } from "./parseCommand.ts";

const APPS = [
  "Google Chrome",
  "Safari",
  "Tabby",
  "Microsoft Edge",
  "Microsoft Word",
];

const parsed = (text: string) => parseCommand(text, APPS);

test("close the X tab closes a tab by match", () => {
  assert.deepEqual(parsed("Close the Grok tab."), {
    kind: "intent",
    intent: { kind: "closeTab", match: "grok", browser: null },
  });
});

test("go to and switch to the X tab switch tabs", () => {
  for (const text of ["go to my gmail tab", "switch to the gmail tab"]) {
    assert.deepEqual(parsed(text), {
      kind: "intent",
      intent: { kind: "switchTab", match: "gmail", browser: null },
    });
  }
});

test("a named browser is matched to an installed app", () => {
  assert.deepEqual(parsed("close the youtube tab in chrome"), {
    kind: "intent",
    intent: { kind: "closeTab", match: "youtube", browser: "Google Chrome" },
  });
  assert.deepEqual(parsed("close the youtube tab in microsoft"), {
    kind: "ambiguous",
    apps: ["Microsoft Edge", "Microsoft Word"],
  });
});

test("close tab never quits an app whose name starts with tab", () => {
  for (const text of ["close tab", "close this tab", "close the current tab"]) {
    assert.deepEqual(parsed(text), {
      kind: "intent",
      intent: { kind: "keys", key: "w", modifiers: ["mod"] },
    });
  }
});

test("new tab presses the new tab shortcut", () => {
  for (const text of ["new tab", "open a new tab", "open new tab"]) {
    assert.deepEqual(parsed(text), {
      kind: "intent",
      intent: { kind: "keys", key: "t", modifiers: ["mod"] },
    });
  }
});

test("app commands still work around tab phrases", () => {
  assert.deepEqual(parsed("close safari"), {
    kind: "intent",
    intent: { kind: "quit", app: "Safari" },
  });
});
