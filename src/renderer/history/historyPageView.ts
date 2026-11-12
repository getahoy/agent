import {
  blankFor,
  type EntryView,
  type ListPhase,
  listView,
} from "@getahoy/lib";
import type { HistoryEntry, HistoryPage } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { mergeFinished } from "../../core/history/finishedEntry.ts";
import { HistoryLoadError, type HistoryPages } from "./historyQueries.ts";

type PageInput = {
  view: EntryView;
  pages: HistoryPages | undefined;
  summary: HistoryPage["summary"];
  summaryPending: boolean;
  finished: readonly HistoryEntry[];
  pending: boolean;
  error: unknown;
  manualFailure: boolean;
  keepHistory: boolean | null;
  cleared: boolean;
};

function phaseOf({ pending, pages, error }: PageInput): ListPhase {
  if (pending) return "loading";
  return error && !pages ? "failed" : "ready";
}

export function pageView(input: PageInput) {
  const { view, pages, keepHistory, error } = input;
  const server = pages?.pages.flatMap((page) => page.entries) ?? [];
  const off = keepHistory === false;
  const entries = off ? [] : mergeFinished(server, input.finished, view);
  const signedOut =
    error instanceof HistoryLoadError && error.failure === "signedOut";
  const blank = blankFor({
    ...view,
    phase: phaseOf(input),
    keepHistory,
    signedOut,
    cleared: input.cleared,
    count: entries.length,
  });
  const shown = listView({
    ...view,
    blank,
    count: entries.length,
    summary: input.summary,
    summaryPending: input.summaryPending,
    offline: false,
    stale: Boolean(error) && pages !== undefined,
    manualFailure: input.manualFailure,
  });
  const notice = shown.notice ? historyCopy.couldNotRefresh : null;
  return { entries, blank, ...shown, notice };
}
