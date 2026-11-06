import assert from "node:assert/strict";
import { test } from "node:test";
import type { HistoryEntry } from "@getahoy/protocol";
import {
  type FinishedTurn,
  finishedEntry,
  mergeFinished,
} from "./finishedEntry.ts";

const AT = Date.parse("2026-11-07T10:00:02.000Z");
const ID = "6f1c8a52-3b8e-4c1f-9a2d-1b2c3d4e5f60";

const turn: FinishedTurn = {
  threadId: ID,
  heard: "open pages",
  status: "done",
  message: "Opened Pages",
  round: 0,
  app: "Pages",
  via: "rules",
  reason: null,
  onMacMs: 2000,
  mac: { key: "A".repeat(43), name: "Studio Mac" },
  at: AT,
};

const ALL = { filter: "all" as const, search: "" };

test("a finished turn becomes an entry with the thread id and Mac time", () => {
  const entry = finishedEntry(turn);
  assert.equal(entry.id, ID);
  assert.equal(entry.status, "done");
  assert.equal(entry.startedAt, "2026-11-07T10:00:00.000Z");
  assert.deepEqual(entry.timings, { onMacMs: 2000 });
});

test("statuses map like the phone's: choice after a follow-up, blocked, running", () => {
  assert.equal(finishedEntry({ ...turn, round: 1 }).status, "choice");
  const refused = finishedEntry({ ...turn, status: "refused", reason: null });
  assert.equal(refused.status, "blocked");
  assert.equal(refused.reason, "other");
  const asking = finishedEntry({ ...turn, status: "needsChoice" });
  assert.equal(asking.status, "running");
  assert.equal(asking.finishedAt, null);
});

test("a server row with the same id replaces the local one", () => {
  const local = finishedEntry(turn);
  const server: HistoryEntry = { ...local, did: "Opened Pages (server)" };
  const merged = mergeFinished([server], [local], ALL);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.did, "Opened Pages (server)");
});

test("local entries sit on top of the server page until the server has them", () => {
  const older: HistoryEntry = {
    ...finishedEntry(turn),
    id: "0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d",
    startedAt: "2026-11-07T09:00:00.000Z",
  };
  const local = finishedEntry(turn);
  const merged = mergeFinished([older], [local], ALL);
  const ids = merged.map((entry) => entry.id);
  assert.deepEqual(ids, [local.id, older.id]);
});

test("local entries follow the filter and the search", () => {
  const local = finishedEntry(turn);
  const count = (filter: "all" | "failed", search: string) =>
    mergeFinished([], [local], { filter, search }).length;
  assert.equal(count("failed", ""), 0);
  assert.equal(count("all", "PAGES"), 1);
  assert.equal(count("all", "chrome"), 0);
});
