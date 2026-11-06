import type { HistoryEntry } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { cn } from "../lib/cn.ts";
import { timeLabel } from "./historyView.ts";
import { StatusMark } from "./statusMark.tsx";

type HistoryRowProps = {
  entry: HistoryEntry;
  selected: boolean;
  onOpen: (id: string) => void;
};

export function HistoryRow({ entry, selected, onOpen }: HistoryRowProps) {
  const running = entry.status === "running";
  const did = running
    ? historyCopy.working
    : (entry.did ?? historyCopy.status[entry.status]);
  const time = timeLabel(new Date(entry.startedAt));
  return (
    <li>
      <button
        type="button"
        disabled={running}
        aria-current={selected ? "true" : undefined}
        onClick={() => onOpen(entry.id)}
        className={cn(
          "flex w-full cursor-default flex-col gap-1 rounded-entry p-2.5 text-left hover:bg-linen disabled:hover:bg-transparent",
          selected && "bg-linen",
        )}
      >
        <span className="flex items-baseline gap-2.5">
          <span className="line-clamp-3 min-w-0 flex-1 font-display text-entry italic">
            “{entry.heard}”
          </span>
          <span className="shrink-0 font-medium font-mono text-driftwood text-label">
            {time}
          </span>
        </span>
        <span className="flex items-start gap-2 text-driftwood text-ui">
          <span className="flex h-4.5 w-4 shrink-0 items-center justify-center">
            <StatusMark status={entry.status} />
          </span>
          <span className="min-w-0 flex-1">{did}</span>
        </span>
      </button>
    </li>
  );
}
