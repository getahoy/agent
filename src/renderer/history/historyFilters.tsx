import { HISTORY_FILTERS, type HistoryFilter } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { cn } from "../lib/cn.ts";

type HistoryFiltersProps = {
  filter: HistoryFilter;
  onChange: (filter: HistoryFilter) => void;
};

export function HistoryFilters({ filter, onChange }: HistoryFiltersProps) {
  return (
    <div
      role="tablist"
      aria-label={historyCopy.filterLabel}
      className="flex rounded-pill bg-linen p-0.5"
    >
      {HISTORY_FILTERS.map((option) => {
        const selected = option === filter;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option)}
            className={cn(
              "h-6.5 flex-1 cursor-default rounded-pill font-medium text-caption transition-colors duration-240",
              selected ? "bg-paper text-ink shadow-thumb" : "text-driftwood",
            )}
          >
            {historyCopy.filters[option]}
          </button>
        );
      })}
    </div>
  );
}
