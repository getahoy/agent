import assert from "node:assert/strict";
import { test } from "node:test";
import { matchApp } from "./matchApp.ts";

const APPS = [
  "Google Chrome",
  "Safari",
  "Terminal",
  "Visual Studio Code",
  "Xcode",
  "Notes",
  "Microsoft Teams",
  "Microsoft Word",
];

test("an exact name wins, ignoring case", () => {
  assert.deepEqual(matchApp("terminal", APPS), {
    kind: "one",
    app: "Terminal",
  });
});

test("a whole word finds the app", () => {
  assert.deepEqual(matchApp("chrome", APPS), {
    kind: "one",
    app: "Google Chrome",
  });
});

test("a whole word beats a substring", () => {
  assert.deepEqual(matchApp("code", APPS), {
    kind: "one",
    app: "Visual Studio Code",
  });
});

test("two apps in the same tier are ambiguous", () => {
  assert.deepEqual(matchApp("microsoft", APPS), {
    kind: "many",
    apps: ["Microsoft Teams", "Microsoft Word"],
  });
});

test("a substring is the last resort", () => {
  assert.deepEqual(matchApp("xco", APPS), { kind: "one", app: "Xcode" });
});

test("nothing matches an unknown name", () => {
  assert.deepEqual(matchApp("xyzzy", APPS), { kind: "none" });
});
