import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_NEAREST, nearestTargets, similarity } from "./nearestTargets.ts";
import type { ScreenElement } from "./screenElement.ts";

const WINDOW = { x: 0, y: 0, width: 800, height: 600 };

let nextRef = 0;
const button = (title: string, actions = ["AXPress"]): ScreenElement => {
  nextRef += 1;
  return {
    ref: `e${nextRef}`,
    role: "AXButton",
    title,
    enabled: true,
    actions,
    frame: { x: 10 * nextRef, y: 10, width: 40, height: 20 },
  };
};

test("similarity scores shared letter pairs", () => {
  assert.equal(similarity("save", "save"), 1);
  assert.ok(similarity("sav", "save") > 0.7);
  assert.equal(similarity("delete", "edit"), 0);
});

test("the closest labels come first, unrelated ones are left out", () => {
  const saveAs = button("Save As…");
  const save = button("Save");
  const cancel = button("Cancel");
  assert.deepEqual(nearestTargets([cancel, saveAs, save], WINDOW, "sav"), [
    save,
    saveAs,
  ]);
});

test("nothing close means no candidates", () => {
  const elements = [button("Cancel"), button("Open")];
  assert.deepEqual(nearestTargets(elements, WINDOW, "xyzzy"), []);
});

test("only pressable elements, and never more than nine", () => {
  const text = button("Save", []);
  const many = Array.from({ length: 12 }, () => button("Save"));
  const found = nearestTargets([text, ...many], WINDOW, "sav");
  assert.equal(found.length, MAX_NEAREST);
  assert.ok(!found.includes(text));
});
