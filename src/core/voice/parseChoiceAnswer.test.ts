import assert from "node:assert/strict";
import { test } from "node:test";
import { parseChoiceAnswer } from "./parseChoiceAnswer.ts";

const pick = (number: number) => ({ kind: "pick", number });

test("digits, number words and ordinals pick", () => {
  const answers: [string, number][] = [
    ["2", 2],
    ["2.", 2],
    ["Two!", 2],
    ["number two", 2],
    ["option 3", 3],
    ["the first one", 1],
    ["third", 3],
    ["one", 1],
    ["number one", 1],
  ];
  for (const [text, number] of answers) {
    assert.deepEqual(parseChoiceAnswer(text, 3), pick(number), text);
  }
});

test("the last one is the highest number", () => {
  assert.deepEqual(parseChoiceAnswer("the last one", 4), pick(4));
  assert.deepEqual(parseChoiceAnswer("aakhri", 2), pick(2));
});

test("hindi numbers and ordinals pick", () => {
  const answers: [string, number][] = [
    ["ek", 1],
    ["do", 2],
    ["teen", 3],
    ["chaar", 4],
    ["pehla", 1],
    ["doosra wala", 2],
    ["teesra", 3],
    ["chautha", 4],
  ];
  for (const [text, number] of answers) {
    assert.deepEqual(parseChoiceAnswer(text, 9), pick(number), text);
  }
});

test("sound-alikes count only inside a short answer", () => {
  const answers: [string, number][] = [
    ["won", 1],
    ["to", 2],
    ["too", 2],
    ["tree", 3],
    ["for", 4],
    ["fore", 4],
    ["ate", 8],
  ];
  for (const [text, number] of answers) {
    assert.deepEqual(parseChoiceAnswer(text, 9), pick(number), text);
  }
  assert.equal(parseChoiceAnswer("go to the settings page now", 9), null);
  assert.equal(parseChoiceAnswer("do it again", 3), null);
});

const CANCELS = [
  "cancel",
  "Never mind.",
  "neither",
  "chhodo",
  "rehne do",
  "kuch nahi",
];
const DELEGATES = ["any", "you pick", "I don't know", "koi bhi", "tum chuno"];
const COMMANDS = ["open spotify", "close the grok tab", "", "two and three"];

test("cancel words cancel", () => {
  for (const text of CANCELS) {
    assert.deepEqual(parseChoiceAnswer(text, 2), { kind: "cancel" }, text);
  }
});

test("delegate words hand the choice back", () => {
  for (const text of DELEGATES) {
    assert.deepEqual(parseChoiceAnswer(text, 2), { kind: "delegate" }, text);
  }
});

test("numbers outside the choices are out of range, zero is nothing", () => {
  assert.deepEqual(parseChoiceAnswer("five", 2), {
    kind: "outOfRange",
    number: 5,
  });
  assert.equal(parseChoiceAnswer("0", 2), null);
});

test("anything else is a new command", () => {
  for (const text of COMMANDS) {
    assert.equal(parseChoiceAnswer(text, 3), null, text);
  }
});
