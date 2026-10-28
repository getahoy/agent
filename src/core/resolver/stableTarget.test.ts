import assert from "node:assert/strict";
import { test } from "node:test";
import type { ScreenElement } from "./screenElement.ts";
import { sameScreen, stillThere } from "./stableTarget.ts";

const WINDOW = { x: 0, y: 0, width: 800, height: 600 };

const save: ScreenElement = {
  ref: "e1",
  role: "AXButton",
  title: "Save",
  enabled: true,
  actions: ["AXPress"],
  frame: { x: 10, y: 10, width: 60, height: 20 },
};

test("the same app, window and element count is the same screen", () => {
  const before = { appPid: 7, window: WINDOW, elements: [save] };
  assert.equal(sameScreen(before, { ...before }), true);
  assert.equal(sameScreen(before, { ...before, appPid: 8 }), false);
  const moved = { ...WINDOW, x: 5 };
  assert.equal(sameScreen(before, { ...before, window: moved }), false);
  assert.equal(sameScreen(before, { ...before, elements: [] }), false);
});

test("the target must keep its label and its place", () => {
  const again = { ...save, ref: "e9" };
  assert.equal(stillThere(save, { kind: "one", target: again }), again);
  const moved = { ...save, frame: { x: 11, y: 10, width: 60, height: 20 } };
  assert.equal(stillThere(save, { kind: "one", target: moved }), null);
  const renamed = { ...save, title: "Saved" };
  assert.equal(stillThere(save, { kind: "one", target: renamed }), null);
  assert.equal(stillThere(save, { kind: "none" }), null);
});
