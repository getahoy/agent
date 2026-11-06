import { Search, X } from "lucide-react";
import { historyCopy } from "../../copy/historyCopy.ts";

type HistorySearchProps = { value: string; onChange: (text: string) => void };

export function HistorySearch({ value, onChange }: HistorySearchProps) {
  return (
    <label className="flex h-8 items-center gap-2 rounded-pill bg-linen pr-1.5 pl-3 text-driftwood">
      <Search aria-hidden="true" strokeWidth={1.5} className="size-3.5" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={historyCopy.searchLabel}
        placeholder={historyCopy.searchPlaceholder}
        className="min-w-0 flex-1 bg-transparent text-ink text-ui outline-none placeholder:text-driftwood"
      />
      {value ? (
        <button
          type="button"
          aria-label={historyCopy.clearSearch}
          onClick={() => onChange("")}
          className="flex size-5 cursor-default items-center justify-center rounded-pill hover:bg-hover"
        >
          <X aria-hidden="true" strokeWidth={1.75} className="size-3" />
        </button>
      ) : null}
    </label>
  );
}
