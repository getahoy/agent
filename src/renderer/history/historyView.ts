import type { HistoryEntry, HistoryTimings } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_WINDOW_DAYS = 6;
const MS_PER_SECOND = 1000;

export type HistoryDay = { title: string; entries: HistoryEntry[] };

export type TimingSegment = {
  label: string;
  ms: number;
  tone: "ink" | "driftwood" | "fog";
};

const startOfDay = (at: Date) =>
  new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();

export function dayLabel(at: Date, now: Date): string {
  const daysAgo = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (daysAgo === 0) return historyCopy.today;
  if (daysAgo === 1) return historyCopy.yesterday;
  if (daysAgo <= WEEKDAY_WINDOW_DAYS) {
    return at.toLocaleDateString(undefined, { weekday: "long" });
  }
  const sameYear = at.getFullYear() === now.getFullYear();
  const year = sameYear ? {} : { year: "numeric" as const };
  return at.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    ...year,
  });
}

export const timeLabel = (at: Date) =>
  at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export function daysOf(entries: readonly HistoryEntry[], now: Date) {
  const days: HistoryDay[] = [];
  for (const entry of entries) {
    const title = dayLabel(new Date(entry.startedAt), now);
    const last = days.at(-1);
    if (last?.title === title) last.entries.push(entry);
    else days.push({ title, entries: [entry] });
  }
  return days;
}

export const seconds = (ms: number) => (ms / MS_PER_SECOND).toFixed(1);

export function timingSegments(timings: HistoryTimings): TimingSegment[] {
  const parts: [string, number | undefined, TimingSegment["tone"]][] = [
    [historyCopy.hearing, timings.hearingMs, "ink"],
    [historyCopy.understanding, timings.understandingMs, "driftwood"],
    [historyCopy.onMac, timings.onMacMs, "fog"],
  ];
  return parts.flatMap(([label, ms, tone]) =>
    ms === undefined ? [] : [{ label, ms, tone }],
  );
}

export function totalMs(timings: HistoryTimings): number | null {
  const segments = timingSegments(timings);
  if (segments.length === 0) return null;
  return segments.reduce((total, segment) => total + segment.ms, 0);
}

export function whyOf(entry: HistoryEntry) {
  const { why } = historyCopy;
  switch (entry.status) {
    case "failed": {
      const text = why[entry.reason ?? "other"];
      return { label: historyCopy.whyFailed, text };
    }
    case "blocked": {
      const text = why[entry.reason ?? "blockedApp"];
      return { label: historyCopy.whyBlocked, text };
    }
    case "cancelled": {
      const text = historyCopy.cancelledWhy;
      return { label: historyCopy.whyCancelled, text };
    }
    case "running":
    case "done":
    case "choice":
      return null;
    default: {
      const unhandled: never = entry.status;
      return unhandled;
    }
  }
}
