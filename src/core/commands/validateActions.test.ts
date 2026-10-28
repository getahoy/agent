import assert from "node:assert/strict";
import { test } from "node:test";
import type { InterpretAction } from "@getahoy/protocol";
import { validateActions } from "./validateActions.ts";

const APPS = ["Google Chrome", "Notes", "Safari"];

test("app actions keep the installed name and switch becomes activate", () => {
  const validation = validateActions(
    [
      { kind: "open", app: "google chrome" },
      { kind: "switch", app: "Notes" },
    ],
    "open the browser then notes",
    APPS,
  );
  assert.deepEqual(validation, {
    kind: "valid",
    intents: [
      { kind: "open", app: "Google Chrome" },
      { kind: "activate", app: "Notes" },
    ],
  });
});

test("one unknown app rejects every action", () => {
  const validation = validateActions(
    [
      { kind: "open", app: "Notes" },
      { kind: "open", app: "Photoshop" },
    ],
    "open notes and photoshop",
    APPS,
  );
  assert.deepEqual(validation, { kind: "rejected" });
});

test("return needs the person to say enter, send, submit or return", () => {
  const keys: InterpretAction[] = [
    { kind: "keys", key: "return", modifiers: [] },
  ];
  assert.deepEqual(validateActions(keys, "do it", APPS), { kind: "rejected" });
  assert.equal(validateActions(keys, "and send it", APPS).kind, "valid");
});

test("typed text must be what the person said", () => {
  const typed = [{ kind: "type", text: "Hello, world" }] as const;
  assert.equal(validateActions(typed, "Type hello world.", APPS).kind, "valid");
  assert.deepEqual(validateActions(typed, "write a greeting", APPS), {
    kind: "rejected",
  });
});

test("a host that is not a plain site is rejected", () => {
  const sites = [
    { kind: "openSite", host: "evil.com/path", browser: null },
  ] as const;
  assert.deepEqual(validateActions(sites, "open evil", APPS), {
    kind: "rejected",
  });
});

test("a blocked shortcut rejects every action", () => {
  const actions: InterpretAction[] = [
    { kind: "switch", app: "Safari" },
    { kind: "keys", key: "q", modifiers: ["mod"] },
  ];
  assert.deepEqual(validateActions(actions, "quit safari", APPS), {
    kind: "rejected",
  });
});

test("a tab match must be spoken and its browser installed", () => {
  const tab = { kind: "closeTab", match: "grok", browser: null } as const;
  assert.equal(
    validateActions([tab], "close the grok tab", APPS).kind,
    "valid",
  );
  assert.equal(validateActions([tab], "close that tab", APPS).kind, "rejected");
  const inArc = { ...tab, browser: "Arc" };
  assert.equal(
    validateActions([inArc], "close grok in arc", APPS).kind,
    "rejected",
  );
  const inChrome = { ...tab, browser: "google chrome" };
  assert.deepEqual(validateActions([inChrome], "close grok in chrome", APPS), {
    kind: "valid",
    intents: [{ kind: "closeTab", match: "grok", browser: "Google Chrome" }],
  });
});

const draft = {
  kind: "draftEmail",
  to: "samarabbas@gmail.com",
  subject: "Hackathon credits",
  body: "Hi Samar, about the hackathon credits.",
  via: "mail",
  browser: null,
} as const;

test("a draft address must be spoken", () => {
  const spoken = "draft a mail to samar abbas at gmail dot com about credits";
  assert.equal(validateActions([draft], spoken, APPS).kind, "valid");
  const other = "draft a mail to rahul about credits";
  assert.equal(validateActions([draft], other, APPS).kind, "rejected");
  const broken = { ...draft, to: "samarabbas" };
  assert.equal(validateActions([broken], spoken, APPS).kind, "rejected");
});

test("a draft is always alone, so nothing can send it", () => {
  const send: InterpretAction = {
    kind: "keys",
    key: "return",
    modifiers: ["mod"],
  };
  const spoken = "send an email to samar abbas at gmail dot com saying hi";
  assert.equal(validateActions([draft, send], spoken, APPS).kind, "rejected");
});

test("a click label must be words the person said", () => {
  const click: InterpretAction = { kind: "click", label: "Continue" };
  assert.equal(
    validateActions([click], "hit the blue continue button", APPS).kind,
    "valid",
  );
  assert.equal(
    validateActions([click], "go to the next step", APPS).kind,
    "rejected",
  );
});

test("a tab closes only when the person said close", () => {
  const close: InterpretAction = {
    kind: "closeTab",
    match: "notion",
    browser: null,
  };
  assert.equal(
    validateActions([close], "switch to the notion tab", APPS).kind,
    "rejected",
  );
  assert.equal(
    validateActions([close], "shut the notion tab", APPS).kind,
    "valid",
  );
});

test("a named browser must be an installed, known browser", () => {
  const inSafari: InterpretAction = {
    kind: "openSite",
    host: "Gmail.com",
    browser: "safari",
  };
  assert.deepEqual(validateActions([inSafari], "open gmail in safari", APPS), {
    kind: "valid",
    intents: [{ kind: "openSite", host: "gmail.com", browser: "Safari" }],
  });
  const inBrave = { ...inSafari, browser: "Brave Browser" };
  assert.equal(
    validateActions([inBrave], "open gmail in brave", APPS).kind,
    "rejected",
  );
  const inNotes = { ...inSafari, browser: "Notes" };
  assert.equal(
    validateActions([inNotes], "open gmail in notes", APPS).kind,
    "rejected",
  );
});

test("no actions means nothing to run", () => {
  assert.deepEqual(validateActions([], "make me a sandwich", APPS), {
    kind: "rejected",
  });
});
