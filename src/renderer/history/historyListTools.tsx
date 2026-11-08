import type { HistoryFilter } from "@getahoy/protocol";
import { HistoryFilters } from "./historyFilters.tsx";
import { HistorySearch } from "./historySearch.tsx";
import { HistorySummary } from "./historySummary.tsx";

type HistoryListToolsProps = {
  notice: string | null;
  summary: string | null;
  summaryPending: boolean;
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
      <HistorySummary text={props.summary} pending={props.summaryPending} />
      <HistorySearch value={props.search} onChange={props.onSearch} />
      <HistoryFilters filter={props.filter} onChange={props.onFilter} />
    </>
  );
}
