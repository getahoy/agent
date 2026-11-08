import type { HistoryFilter } from "@getahoy/protocol";
import { HistoryFilters } from "./historyFilters.tsx";
import { HistorySearch } from "./historySearch.tsx";

type HistoryListToolsProps = {
  notice: string | null;
  summary: string | null;
  search: string;
  filter: HistoryFilter;
  onSearch: (text: string) => void;
  onFilter: (filter: HistoryFilter) => void;
};

export function HistoryListTools(props: HistoryListToolsProps) {
  return (
    <>
      {props.notice ? (
        <span role="status" className="text-caption text-driftwood">
          {props.notice}
        </span>
      ) : null}
      <span className="min-h-lh font-display text-summary">
        {props.summary}
      </span>
      <HistorySearch value={props.search} onChange={props.onSearch} />
      <HistoryFilters filter={props.filter} onChange={props.onFilter} />
    </>
  );
}
