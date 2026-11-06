import type { HistoryEntry, HistoryFilter } from "@getahoy/protocol";
import type { ReactNode, UIEvent } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { HistoryDays } from "./historyDays.tsx";
import { HistoryFilters } from "./historyFilters.tsx";
import { HistorySearch } from "./historySearch.tsx";

type HistoryListPaneProps = {
  entries: readonly HistoryEntry[];
  selected: string | null;
  notice: string | null;
  summary: string | null;
  search: string;
  filter: HistoryFilter;
  blank: ReactNode;
  canClear: boolean;
  onSearch: (text: string) => void;
  onFilter: (filter: HistoryFilter) => void;
  onOpen: (id: string) => void;
  onClear: () => void;
  onNearEnd: () => void;
};

const NEAR_END_PX = 120;

export function HistoryListPane(props: HistoryListPaneProps) {
  const scrolled = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const left = scrollHeight - scrollTop - clientHeight;
    if (left < NEAR_END_PX) props.onNearEnd();
  };
  return (
    <div
      onScroll={scrolled}
      className="flex h-full w-history-list shrink-0 flex-col overflow-y-auto border-rope border-r px-2 pt-12 pb-6"
    >
      <div className="flex flex-col gap-2.5 px-2.5 pb-2">
        <h1 className="font-display text-title">{historyCopy.title}</h1>
        {props.notice ? (
          <span role="status" className="text-caption text-driftwood">
            {props.notice}
          </span>
        ) : null}
        {props.summary ? (
          <span className="text-driftwood text-ui">{props.summary}</span>
        ) : null}
        <HistorySearch value={props.search} onChange={props.onSearch} />
        <HistoryFilters filter={props.filter} onChange={props.onFilter} />
      </div>
      {props.blank}
      <HistoryDays
        entries={props.entries}
        selected={props.selected}
        onOpen={props.onOpen}
      />
      {props.canClear ? (
        <Button
          variant="ghost"
          className="mt-5 self-center text-driftwood"
          onClick={props.onClear}
        >
          {historyCopy.clearHistory}
        </Button>
      ) : null}
    </div>
  );
}
