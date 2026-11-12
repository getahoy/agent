import { type EntryView, entryMatches } from "@getahoy/lib";
import {
  type CommandStatus,
  type FailureReason,
  type HistoryEntry,
  historyReasonOf,
  historyStatusOf,
  type UnderstoodBy,
} from "@getahoy/protocol";

type FinishedTurn = {
  threadId: string;
  heard: string;
  status: CommandStatus;
  message: string;
  round: number;
  app: string | null;
  via: UnderstoodBy | null;
  reason: FailureReason | null;
  onMacMs: number;
  mac: { key: string; name: string };
  at: number;
};

// What this Mac saw, shown until the phone's own record of the same thread reaches the server.
export function finishedEntry(turn: FinishedTurn): HistoryEntry {
  const status = historyStatusOf(turn.status, turn.round > 0);
  const finished = new Date(turn.at).toISOString();
  return {
    id: turn.threadId,
    macKey: turn.mac.key,
    macName: turn.mac.name,
    heard: turn.heard,
    did: turn.message,
    status,
    app: turn.app,
    via: turn.via,
    reason: historyReasonOf(status, turn.reason),
    timings: { onMacMs: turn.onMacMs },
    followUps: [],
    startedAt: new Date(turn.at - turn.onMacMs).toISOString(),
    finishedAt: status === "running" ? null : finished,
  };
}

export function mergeFinished(
  server: readonly HistoryEntry[],
  finished: readonly HistoryEntry[],
  view: EntryView,
): HistoryEntry[] {
  const known = new Set(server.map((entry) => entry.id));
  const local = finished
    .filter((entry) => !known.has(entry.id) && entryMatches(entry, view))
    .sort((first, second) => second.startedAt.localeCompare(first.startedAt));
  return [...local, ...server];
}
