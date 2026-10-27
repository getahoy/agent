import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  type CommandOutcome,
  decideCommand,
  emptyCommandLog,
  finishCommand,
  REMEMBERED_COMMANDS,
  startCommand,
} from "./commandLog.ts";

const OPENED: CommandOutcome = { status: "done", message: "Opened Safari" };

test("a new command runs", () => {
  assert.deepEqual(decideCommand(emptyCommandLog, randomUUID()), {
    kind: "run",
  });
});

test("a repeat while running waits instead of running twice", () => {
  const id = randomUUID();
  const log = startCommand(emptyCommandLog, id);
  assert.deepEqual(decideCommand(log, id), { kind: "running" });
});

test("a repeat after finishing gets the stored result", () => {
  const id = randomUUID();
  const log = finishCommand(startCommand(emptyCommandLog, id), id, OPENED);
  assert.deepEqual(decideCommand(log, id), { kind: "repeat", outcome: OPENED });
  assert.equal(log.running.has(id), false);
});

test("only the last hundred results are kept", () => {
  const first = randomUUID();
  let log = finishCommand(emptyCommandLog, first, OPENED);
  for (let count = 0; count < REMEMBERED_COMMANDS; count += 1) {
    log = finishCommand(log, randomUUID(), OPENED);
  }
  assert.equal(log.done.size, REMEMBERED_COMMANDS);
  assert.deepEqual(decideCommand(log, first), { kind: "run" });
});
