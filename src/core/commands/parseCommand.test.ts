import assert from "node:assert/strict";
import { test } from "node:test";
import { normaliseCommand, parseCommand } from "./parseCommand.ts";

const APPS = ["Google Chrome", "Terminal", "Safari", "Notes"];

const intentOf = (text: string) => parseCommand(text, APPS);

test("open, launch and start open an app", () => {
  for (const verb of ["Open", "launch", "Start"]) {
    assert.deepEqual(intentOf(`${verb} Chrome.`), {
      kind: "intent",
      intent: { kind: "open", app: "Google Chrome" },
    });
  }
});

test("close and quit quit an app", () => {
  assert.deepEqual(intentOf("Close Terminal"), {
    kind: "intent",
    intent: { kind: "quit", app: "Terminal" },
  });
  assert.deepEqual(intentOf("quit the terminal app"), {
    kind: "intent",
    intent: { kind: "quit", app: "Terminal" },
  });
});

test("hide and switch to", () => {
  assert.deepEqual(intentOf("hide safari"), {
    kind: "intent",
    intent: { kind: "hide", app: "Safari" },
  });
  assert.deepEqual(intentOf("go to notes"), {
    kind: "intent",
    intent: { kind: "activate", app: "Notes" },
  });
});

test("search and google search the web", () => {
  assert.deepEqual(intentOf("Search cats"), {
    kind: "intent",
    intent: { kind: "search", query: "cats" },
  });
  assert.deepEqual(intentOf("google best pizza near me"), {
    kind: "intent",
    intent: { kind: "search", query: "best pizza near me" },
  });
});

test("open a site keeps the dot", () => {
  assert.deepEqual(intentOf("Open github.com."), {
    kind: "intent",
    intent: { kind: "openSite", host: "github.com" },
  });
});

test("fillers and politeness are dropped", () => {
  assert.equal(
    normaliseCommand("Hey Ahoy, can you open Chrome please?"),
    "open chrome",
  );
  assert.equal(normaliseCommand("Can you please open Chrome"), "open chrome");
});

test("hinglish endings become the verb", () => {
  assert.deepEqual(intentOf("Chrome open karo"), {
    kind: "intent",
    intent: { kind: "open", app: "Google Chrome" },
  });
  assert.deepEqual(intentOf("terminal band karo"), {
    kind: "intent",
    intent: { kind: "quit", app: "Terminal" },
  });
});

test("an unknown app is named back", () => {
  assert.deepEqual(intentOf("Open Xyzzy"), {
    kind: "unknownApp",
    name: "xyzzy",
  });
});

test("anything else is unsupported", () => {
  assert.deepEqual(intentOf("Make me a sandwich"), { kind: "unsupported" });
});

test("two plausible apps ask which one", () => {
  const apps = ["Microsoft Teams", "Microsoft Word"];
  assert.deepEqual(parseCommand("open microsoft", apps), {
    kind: "ambiguous",
    apps,
  });
});
