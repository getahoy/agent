import assert from "node:assert/strict";
import { test } from "node:test";
import { allowsShortcut, isBlockedShortcut } from "./shortcutRules.ts";

test("quit, force quit and delete shortcuts are blocked", () => {
  const blocked = [
    { key: "q", modifiers: ["mod"] },
    { key: "q", modifiers: ["mod", "alt"] },
    { key: "q", modifiers: ["mod", "shift"] },
    { key: "q", modifiers: ["mod", "alt", "shift"] },
    { key: "escape", modifiers: ["mod", "alt"] },
    { key: "delete", modifiers: ["mod"] },
    { key: "delete", modifiers: ["mod", "alt"] },
    { key: "delete", modifiers: ["mod", "shift"] },
    { key: "delete", modifiers: ["mod", "alt", "shift"] },
    { key: "forwardDelete", modifiers: ["mod"] },
  ] as const;
  for (const shortcut of blocked) {
    assert.equal(isBlockedShortcut(shortcut), true, JSON.stringify(shortcut));
    assert.equal(allowsShortcut(shortcut, "do it"), false);
  }
});

test("power and eject are blocked with or without modifiers", () => {
  for (const key of ["power", "eject"]) {
    assert.equal(isBlockedShortcut({ key, modifiers: [] }), true);
    assert.equal(
      isBlockedShortcut({ key, modifiers: ["mod", "control"] }),
      true,
    );
  }
});

test("app shortcuts with a modifier are allowed", () => {
  const allowed = [
    { key: "p", modifiers: ["mod"] },
    { key: "m", modifiers: ["mod"] },
    { key: "f", modifiers: ["control", "mod"] },
    { key: "=", modifiers: ["mod"] },
    { key: "escape", modifiers: [] },
    { key: "delete", modifiers: [] },
    { key: "pageDown", modifiers: [] },
  ] as const;
  for (const shortcut of allowed) {
    assert.equal(
      allowsShortcut(shortcut, "do it"),
      true,
      JSON.stringify(shortcut),
    );
  }
});

test("letters without a modifier are typing, not a shortcut", () => {
  assert.equal(allowsShortcut({ key: "a", modifiers: [] }, "press a"), false);
  assert.equal(
    allowsShortcut({ key: "a", modifiers: ["shift"] }, "press a"),
    false,
  );
});

test("return, with or without modifiers, needs the spoken words", () => {
  const send = { key: "return", modifiers: ["mod"] } as const;
  assert.equal(allowsShortcut(send, "do it"), false);
  assert.equal(allowsShortcut(send, "and send it"), true);
  assert.equal(
    allowsShortcut({ key: "return", modifiers: [] }, "press enter"),
    true,
  );
});
