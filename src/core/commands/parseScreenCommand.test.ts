import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCommand } from "./parseCommand.ts";

const APPS = ["Google Chrome", "Notes"];

const parsed = (text: string) => parseCommand(text, APPS);

test("click, press and tap name a label to click", () => {
  for (const text of ["Click Save.", "tap on the save button", "press save"]) {
    assert.deepEqual(parsed(text), {
      kind: "intent",
      intent: { kind: "click", label: "save" },
    });
  }
  assert.deepEqual(parsed("click the sign in link"), {
    kind: "intent",
    intent: { kind: "click", label: "sign in" },
  });
});

test("press with a key name presses the key", () => {
  assert.deepEqual(parsed("press enter"), {
    kind: "intent",
    intent: { kind: "keys", key: "return", modifiers: [] },
  });
  assert.deepEqual(parsed("press esc"), {
    kind: "intent",
    intent: { kind: "keys", key: "escape", modifiers: [] },
  });
  assert.deepEqual(parsed("click delete"), {
    kind: "intent",
    intent: { kind: "click", label: "delete" },
  });
});

test("scroll and page move a page at a time", () => {
  assert.deepEqual(parsed("scroll down"), {
    kind: "intent",
    intent: { kind: "keys", key: "pageDown", modifiers: [] },
  });
  assert.deepEqual(parsed("page up"), {
    kind: "intent",
    intent: { kind: "keys", key: "pageUp", modifiers: [] },
  });
});

test("go to top and bottom jump to the ends", () => {
  assert.deepEqual(parsed("go to the top"), {
    kind: "intent",
    intent: { kind: "keys", key: "up", modifiers: ["mod"] },
  });
  assert.deepEqual(parsed("scroll to bottom"), {
    kind: "intent",
    intent: { kind: "keys", key: "down", modifiers: ["mod"] },
  });
});

test("go to an app still switches to it", () => {
  assert.deepEqual(parsed("go to notes"), {
    kind: "intent",
    intent: { kind: "activate", app: "Notes" },
  });
});
