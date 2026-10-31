import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_SPEECH_CHARS } from "@getahoy/protocol";
import { elementArea } from "../resolver/elementArea.ts";
import { buildSpeech } from "./buildSpeech.ts";
import { nameOfAddress, nounsFor } from "./spokenWords.ts";
import { MAX_FOLLOW_UPS, nextRound } from "./threadRules.ts";

const WINDOW = { x: 100, y: 50, width: 1000, height: 800 };
const at = (x: number, y: number) => ({ x, y, width: 40, height: 20 });

test("areas come from where the element sits in its window", () => {
  assert.equal(elementArea(at(600, 60), WINDOW), "toolbar");
  assert.equal(elementArea(at(600, 800), WINDOW), "bottom");
  assert.equal(elementArea(at(150, 400), WINDOW), "sidebar");
  assert.equal(elementArea(at(600, 400), WINDOW), null);
});

test("two or three choices name their areas only when each is different", () => {
  assert.equal(
    buildSpeech({
      kind: "choices",
      label: "save",
      nouns: "buttons",
      areas: ["toolbar", "bottom"],
    }),
    "I see two Save buttons. One in the toolbar, two at the bottom. Say one or two.",
  );
  assert.equal(
    buildSpeech({
      kind: "choices",
      label: "save",
      nouns: "buttons",
      areas: ["toolbar", "toolbar"],
    }),
    "I see two Save buttons. Say one or two.",
  );
  assert.equal(
    buildSpeech({
      kind: "choices",
      label: "save",
      nouns: "buttons",
      areas: ["toolbar", null],
    }),
    "I see two Save buttons. Say one or two.",
  );
});

test("four or more choices point at the numbers on the Mac", () => {
  const areas = [null, null, null, null, null];
  assert.equal(
    buildSpeech({ kind: "choices", label: "save", nouns: "buttons", areas }),
    "I see five matches. They're numbered on your Mac. Say a number.",
  );
});

test("the other cases read like speech", () => {
  assert.equal(
    buildSpeech({ kind: "done", message: "Closed the Grok tab" }),
    "Done. Closed the Grok tab.",
  );
  assert.equal(
    buildSpeech({ kind: "draft", name: "Jake" }),
    "Drafted an email to Jake. Check it and press Send.",
  );
  assert.equal(
    buildSpeech({ kind: "outOfRange", count: 2 }),
    "There are only two. Say one or two.",
  );
  assert.equal(
    buildSpeech({ kind: "delegated", label: "Save", area: "toolbar" }),
    "Picked one, the Save in the toolbar.",
  );
  assert.equal(
    buildSpeech({ kind: "delegateRefused", count: 2 }),
    "I won't pick for a delete. Say one or two, or cancel.",
  );
  assert.equal(
    buildSpeech({ kind: "notFound", label: "sav" }),
    "I can't find Sav on screen. Try saying it differently.",
  );
});

test("long speech is cut at a sentence, never past 140 characters", () => {
  const message = `${"Opened a very long window name ".repeat(4)}. Then more. And more text here.`;
  const spoken = buildSpeech({ kind: "say", message }) ?? "";
  assert.ok(spoken.length <= MAX_SPEECH_CHARS, spoken);
  assert.ok(spoken.endsWith("."));
});

test("emails are spoken by name, roles by their plural", () => {
  assert.equal(nameOfAddress("jake.bauer99@gmail.com"), "Jake Bauer");
  assert.equal(nameOfAddress("rahul@example.com"), "Rahul");
  assert.equal(nounsFor(["AXButton", "AXButton"]), "buttons");
  assert.equal(nounsFor(["AXButton", "AXLink"]), "matches");
});

test("three follow-ups at most", () => {
  assert.equal(nextRound(0), 1);
  assert.equal(nextRound(MAX_FOLLOW_UPS - 1), MAX_FOLLOW_UPS);
  assert.equal(nextRound(MAX_FOLLOW_UPS), null);
});
