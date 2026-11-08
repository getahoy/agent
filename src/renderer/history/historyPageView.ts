import type { HistoryEntry, HistoryPage } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { mergeFinished } from "../../core/history/finishedEntry.ts";
import { blankFor, type ListPhase } from "./historyBlankKind.ts";
import {
  HistoryLoadError,
  type HistoryPages,
  type ListView,
} from "./historyQueries.ts";

type PageInput = {
  view: ListView;
  pages: HistoryPages | undefined;
  summary: HistoryPage["summary"];
  finished: readonly HistoryEntry[];
  pending: boolean;
  error: unknown;
  keepHistory: boolean | null;
  cleared: boolean;
};

function phaseOf({ pending, pages, error }: PageInput): ListPhase {
  if (pending) return "loading";
  return error && !pages ? "failed" : "ready";
}

export function pageView(input: PageInput) {
  const { view, pages, summary, keepHistory, cleared, error } = input;
  const off = keepHistory === false;
  const server = pages?.pages.flatMap((page) => page.entries) ?? [];
  const entries = off ? [] : mergeFinished(server, input.finished, view);
  const plain = view.filter === "all" && !view.search;
  const failure = error instanceof HistoryLoadError ? error.failure : "refused";
  const shown = { phase: phaseOf(input), keepHistory, cleared };
  const count = entries.length;
  return {
    entries,
    blank: blankFor({
      ...shown,
      ...view,
      count,
      failure: error ? failure : null,
    }),
    notice: error && pages ? historyCopy.couldNotRefresh : null,
    summary: summary
      ? historyCopy.summary(summary.lastSevenDays, summary.didntGoThrough)
      : null,
    canClear: plain && count > 0,
  };
}
