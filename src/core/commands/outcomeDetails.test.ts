import assert from "node:assert/strict";
import { test } from "node:test";
import { because, done, failed, refused } from "./commandLog.ts";
import { appOfIntent, failureReasonOf } from "./outcomeDetails.ts";

test("done and choice outcomes carry no failure reason", () => {
  assert.equal(failureReasonOf(done("Opened Pages")), undefined);
  const asking = { status: "needsChoice" as const, message: "Which one?" };
  assert.equal(failureReasonOf(asking), undefined);
});

test("a failure keeps its own reason and falls back to other", () => {
  const missing = because(failed("Not found"), "targetNotFound");
  assert.equal(failureReasonOf(missing), "targetNotFound");
  assert.equal(failureReasonOf(failed("That didn’t work")), "other");
});

test("a refusal keeps its own reason and falls back to other", () => {
  const blocked = because(refused("Blocked"), "blockedApp");
  assert.equal(failureReasonOf(blocked), "blockedApp");
  assert.equal(failureReasonOf(refused("Unlock first")), "other");
});

test("app intents act on their app, web and tab intents on their browser", () => {
  assert.equal(appOfIntent({ kind: "open", app: "Pages" }), "Pages");
  assert.equal(appOfIntent({ kind: "quit", app: "Notes" }), "Notes");
  const site = { kind: "openSite" as const, host: "x.com", browser: "Arc" };
  assert.equal(appOfIntent(site), "Arc");
  const tab = { kind: "closeTab" as const, match: "grok", browser: null };
  assert.equal(appOfIntent(tab), null);
});

test("email drafts act on Mail or the Gmail browser", () => {
  const draft = {
    kind: "draftEmail" as const,
    to: null,
    subject: "",
    body: "",
  };
  assert.equal(appOfIntent({ ...draft, via: "mail", browser: null }), "Mail");
  assert.equal(appOfIntent({ ...draft, via: "gmail", browser: "Arc" }), "Arc");
  assert.equal(appOfIntent({ ...draft, via: "gmail", browser: null }), "Gmail");
});

test("screen intents leave the app to whatever is in front", () => {
  assert.equal(appOfIntent({ kind: "click", label: "Save" }), null);
  assert.equal(appOfIntent({ kind: "type", text: "hello" }), null);
});
