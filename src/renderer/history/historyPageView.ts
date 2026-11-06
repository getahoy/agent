import type { HistoryEntry, HistoryFilter } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { blankFor } from "./historyBlankKind.ts";
import type { MacListState } from "./historyListState.ts";

type PageInput = {
  list: MacListState;
  filter: HistoryFilter;
  search: string;
  hidden: ReadonlySet<string>;
  keepHistory: boolean | null;
  cleared: boolean;
};

export function pageView(input: PageInput) {
  const { list, filter, search, keepHistory, cleared } = input;
  const off = keepHistory === false;
  const entries: HistoryEntry[] = off
    ? []
    : list.entries.filter((entry) => !input.hidden.has(entry.id));
  const plain = filter === "all" && !search.trim();
  const count = entries.length;
  const { phase, failure, summary } = list;
  const shown = { phase, failure, keepHistory, cleared, count };
  return {
    entries,
    blank: blankFor({ ...shown, filter, search }),
    notice: list.stale ? historyCopy.couldNotRefresh : null,
    summary:
      plain && summary
        ? historyCopy.summary(summary.lastSevenDays, summary.didntGoThrough)
        : null,
    canClear: plain && count > 0,
  };
}
