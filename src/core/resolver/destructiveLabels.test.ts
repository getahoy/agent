import assert from "node:assert/strict";
import { test } from "node:test";
import { isDestructive } from "./destructiveLabels.ts";

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
