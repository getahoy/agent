import type { HistoryEntry } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { cn } from "../lib/cn.ts";
import { timeLabel } from "./historyView.ts";
import { StatusMark } from "./statusMark.tsx";

type HistoryRowProps = {
  entry: HistoryEntry;
  selected: boolean;
  dimmed: boolean;
  onOpen: (id: string) => void;
};

export function HistoryRow({
  entry,
  selected,
  dimmed,
  onOpen,
}: HistoryRowProps) {
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
        aria-expanded={selected}
        data-entry-id={entry.id}
        onClick={() => onOpen(entry.id)}
        className={cn(
          "flex w-full max-w-entry-row cursor-default flex-col gap-0.75 rounded-entry px-3 py-2.5 text-left transition-[background-color,opacity] duration-240 hover:bg-linen disabled:hover:bg-transparent",
          selected && "bg-linen",
          dimmed && "opacity-40 hover:opacity-100 focus-visible:opacity-100",
        )}
      >
        <span className="flex items-baseline gap-3">
          <span className="line-clamp-2 min-w-0 flex-1 font-display text-entry italic">
            “{entry.heard}”
          </span>
          <span className="shrink-0 font-medium font-mono text-driftwood text-label">
            {time}
          </span>
        </span>
        <span className="flex items-start gap-2 text-body-sm text-driftwood">
          <span className="flex h-4.5 w-4 shrink-0 items-center justify-center">
            <StatusMark status={entry.status} />
          </span>
          <span className="min-w-0 flex-1">{did}</span>
        </span>
      </button>
    </li>
  );
}
