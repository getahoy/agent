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

test("the same app and window is the same screen, whatever else changed", () => {
  const before = { appPid: 7, window: WINDOW, elements: [save] };
  assert.equal(sameScreen(before, { ...before }), true);
  assert.equal(sameScreen(before, { ...before, elements: [] }), true);
  assert.equal(sameScreen(before, { ...before, appPid: 8 }), false);
  const moved = { ...WINDOW, x: 5 };
  assert.equal(sameScreen(before, { ...before, window: moved }), false);
});

test("the target must keep its label and its place", () => {
  const again = { ...save, ref: "e9" };
  assert.equal(stillThere(save, [again]), again);
  const moved = { ...save, frame: { x: 11, y: 10, width: 60, height: 20 } };
  assert.equal(stillThere(save, [moved]), null);
  const renamed = { ...save, title: "Saved" };
  assert.equal(stillThere(save, [renamed]), null);
  assert.equal(stillThere(save, [{ ...save, enabled: false }]), null);
  assert.equal(stillThere(save, []), null);
});

test("one of two same-label elements is found by its place", () => {
  const second = { ...save, ref: "e2", frame: { ...WINDOW, x: 300 } };
  const found = stillThere(second, [save, { ...second, ref: "e5" }]);
  assert.equal(found?.ref, "e5");
});
