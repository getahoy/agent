import assert from "node:assert/strict";
import { test } from "node:test";
import { isDestructive, isDestructiveElement } from "./destructiveLabels.ts";

test("a destructive description or tooltip counts, not just the title", () => {
  const element = {
    ref: "e1",
    role: "AXButton",
    title: "OK",
    help: "Delete this note permanently",
    enabled: true,
    actions: ["AXPress"],
  };
  assert.equal(isDestructiveElement(element), true);
  assert.equal(isDestructiveElement({ ...element, help: "Close" }), false);
});

test("destructive labels match as whole words, any case", () => {
  for (const label of [
    "Delete",
    "delete message",
    "Don’t Save",
    "Move to Trash…",
    "SEND",
    "Sign out of all devices",
  ]) {
    assert.equal(isDestructive(label), true, label);
  }
});

test("labels that only contain the letters are not destructive", () => {
  for (const label of [
    "Save",
    "Sender",
    "Resetting guide",
    "Buyer info",
    "Paying",
  ]) {
    assert.equal(isDestructive(label), false, label);
  }
});
