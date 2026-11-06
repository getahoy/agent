import type {
  CommandStatus,
  FailureReason,
  HistoryEntry,
  HistoryFilter,
  HistoryStatus,
  UnderstoodBy,
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

function statusOf(status: CommandStatus, round: number): HistoryStatus {
  switch (status) {
    case "done":
      return round > 0 ? "choice" : "done";
    case "needsChoice":
      return "running";
    case "refused":
      return "blocked";
    case "failed":
      return "failed";
    default: {
      const unhandled: never = status;
      return unhandled;
    }
  }
}

// What this Mac saw, shown until the phone's own record of the same thread reaches the server.
export function finishedEntry(turn: FinishedTurn): HistoryEntry {
  const status = statusOf(turn.status, turn.round);
  const ended = status === "failed" || status === "blocked";
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
    reason: ended ? (turn.reason ?? "other") : null,
    timings: { onMacMs: turn.onMacMs },
    followUps: [],
    startedAt: new Date(turn.at - turn.onMacMs).toISOString(),
    finishedAt: status === "running" ? null : finished,
  };
}

const SHOWN_BY: Record<HistoryFilter, readonly HistoryStatus[] | null> = {
  all: null,
  done: ["done", "choice"],
  failed: ["failed", "blocked"],
};

type ListView = { filter: HistoryFilter; search: string };

function matches(entry: HistoryEntry, { filter, search }: ListView) {
  const statuses = SHOWN_BY[filter];
  if (statuses && !statuses.includes(entry.status)) return false;
  const words = search.trim().toLowerCase();
  if (!words) return true;
  const text = [entry.heard, entry.did ?? "", entry.app ?? ""].join(" ");
  return text.toLowerCase().includes(words);
}

export function mergeFinished(
  server: readonly HistoryEntry[],
  finished: readonly HistoryEntry[],
  view: ListView,
): HistoryEntry[] {
  const known = new Set(server.map((entry) => entry.id));
  const local = finished
    .filter((entry) => !known.has(entry.id) && matches(entry, view))
    .sort((first, second) => second.startedAt.localeCompare(first.startedAt));
  return [...local, ...server];
}
