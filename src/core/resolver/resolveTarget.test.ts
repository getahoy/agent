import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveTarget } from "./resolveTarget.ts";
import { labelOf, type ScreenElement } from "./screenElement.ts";

const WINDOW = { x: 0, y: 0, width: 800, height: 600 };

let nextRef = 0;
const element = (
  extra: Partial<ScreenElement>,
  x = 10 * ++nextRef,
): ScreenElement => ({
  ref: `e${nextRef}`,
  role: "AXButton",
  enabled: true,
  actions: ["AXPress"],
  frame: { x, y: 10, width: 60, height: 20 },
  ...extra,
});

test("exact beats whole word beats contains", () => {
  const save = element({ title: "Save" });
  const saveAs = element({ title: "Save As…" });
  const autosave = element({ title: "Autosave" });
  const elements = [saveAs, autosave, save];
  assert.deepEqual(resolveTarget(elements, WINDOW, "save"), {
    kind: "one",
    target: save,
  });
  assert.deepEqual(resolveTarget([saveAs, autosave], WINDOW, "save"), {
    kind: "one",
    target: saveAs,
  });
  assert.deepEqual(resolveTarget([autosave], WINDOW, "save"), {
    kind: "one",
    target: autosave,
  });
});

test("ellipses, case and punctuation are ignored", () => {
  const more = element({ title: "More..." });
  assert.equal(resolveTarget([more], WINDOW, "MORE").kind, "one");
  const saveAs = element({ title: "Save As…" });
  assert.equal(resolveTarget([saveAs], WINDOW, "save as").kind, "one");
});

test("description, help, placeholder and subrole are matched too", () => {
  for (const field of ["description", "help", "placeholder", "subrole"]) {
    const found = element({ [field]: "Search mail" });
    assert.equal(resolveTarget([found], WINDOW, "search mail").kind, "one");
  }
});

test("disabled, empty, off-window and frameless elements are skipped", () => {
  const skipped = [
    element({ title: "Save", enabled: false }),
    element({ title: "Save", frame: { x: 5, y: 5, width: 0, height: 20 } }),
    element({ title: "Save", frame: { x: 900, y: 5, width: 60, height: 20 } }),
    element({ title: "Save", frame: undefined }),
  ];
  assert.deepEqual(resolveTarget(skipped, WINDOW, "save"), { kind: "none" });
});

test("an element scrolled out of its scroll area is not usable", () => {
  const clip = { x: 0, y: 0, width: 800, height: 100 };
  const hidden = element({
    title: "Save",
    frame: { x: 10, y: 300, width: 60, height: 20 },
    clip,
  });
  assert.deepEqual(resolveTarget([hidden], WINDOW, "save"), { kind: "none" });
  const shown = element({ title: "Save", clip });
  assert.equal(resolveTarget([shown], WINDOW, "save").kind, "one");
});

test("a pressable match beats a plain one in the same tier", () => {
  const text = element({ title: "Send", actions: [] }, 100);
  const button = element({ title: "Send" }, 300);
  assert.deepEqual(resolveTarget([text, button], WINDOW, "send"), {
    kind: "one",
    target: button,
  });
});

test("window buttons are found by their friendly names", () => {
  const close = element({ subrole: "AXCloseButton" });
  assert.deepEqual(resolveTarget([close], WINDOW, "close button"), {
    kind: "one",
    target: close,
  });
  assert.equal(labelOf(close), "Close button");
});

test("two real matches are returned, a nested copy collapses", () => {
  const first = element({ title: "Delete" });
  const second = element({ title: "Delete" });
  assert.deepEqual(resolveTarget([first, second], WINDOW, "delete"), {
    kind: "many",
    targets: [first, second],
  });
  const group = element({ title: "Send", role: "AXGroup", actions: [] }, 400);
  const button = element({ title: "Send" }, 400);
  assert.deepEqual(resolveTarget([group, button], WINDOW, "send"), {
    kind: "one",
    target: button,
  });
});
