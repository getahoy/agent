import assert from "node:assert/strict";
import { test } from "node:test";
import { refindTarget } from "./refindTarget.ts";
import type { ScreenElement } from "./screenElement.ts";

const PAGES = { pid: 7, name: "Pages" };
const MAIL = { pid: 9, name: "Mail" };

const save: ScreenElement = {
  ref: "e1",
  role: "AXButton",
  title: "Save",
  enabled: true,
  actions: ["AXPress"],
  frame: { x: 10, y: 10, width: 60, height: 20 },
};

const remove: ScreenElement = { ...save, ref: "e2", title: "Delete" };

const at = (element: ScreenElement, x: number): ScreenElement => ({
  ...element,
  ref: `${element.ref}-fresh`,
  frame: { x, y: 10, width: 60, height: 20 },
});

const refind = (
  target: ScreenElement,
  elements: ScreenElement[],
  pick: "chosen" | "confirmed" = "chosen",
  now = PAGES,
) => refindTarget({ target, pick, was: PAGES, now, elements });

test("one match clicks the fresh element, even after it moved", () => {
  const moved = at(save, 300);
  assert.deepEqual(refind(save, [moved]), { kind: "click", element: moved });
  const still = at(save, 10);
  assert.equal(refind(save, [still]).kind, "click");
});

test("a disabled or differently named element is not a match", () => {
  const disabled = { ...at(save, 10), enabled: false };
  const other = { ...at(save, 10), title: "Save As" };
  assert.deepEqual(refind(save, [disabled, other]), {
    kind: "gone",
    label: "Save",
  });
});

test("the same label with another role is not a match", () => {
  const link = { ...at(save, 10), role: "AXLink" };
  assert.equal(refind(save, [link]).kind, "gone");
});

test("several matches offer fresh numbers", () => {
  const found = refind(save, [at(save, 10), at(save, 200)]);
  assert.equal(found.kind, "offer");
  assert.equal(found.kind === "offer" && found.elements.length, 2);
});

test("another app in front names both apps", () => {
  assert.deepEqual(refind(save, [at(save, 10)], "chosen", MAIL), {
    kind: "otherApp",
    now: "Mail",
    was: "Pages",
  });
});

test("a confirmed destructive target that moved is confirmed again", () => {
  const moved = at(remove, 300);
  assert.equal(refind(remove, [moved], "confirmed").kind, "confirm");
  assert.equal(refind(remove, [at(remove, 10)], "confirmed").kind, "click");
});

test("a destructive target picked from a list always confirms first", () => {
  assert.equal(refind(remove, [at(remove, 10)], "chosen").kind, "confirm");
});
