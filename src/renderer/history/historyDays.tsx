import type { HistoryEntry } from "@getahoy/protocol";
import { cn } from "../lib/cn.ts";
import { HistoryRow } from "./historyRow.tsx";
import { daysOf } from "./historyView.ts";

type HistoryDaysProps = {
  entries: readonly HistoryEntry[];
  selected: string | null;
  onOpen: (id: string) => void;
};

export function HistoryDays({ entries, selected, onOpen }: HistoryDaysProps) {
  const open = selected !== null;
  return daysOf(entries, new Date()).map((day) => (
    <section key={day.title} aria-label={day.title}>
      <h2
        className={cn(
          "px-3 pt-5.5 pb-1.5 font-medium font-mono text-driftwood text-label uppercase transition-opacity duration-240",
          open && "opacity-40",
        )}
      >
        {day.title}
      </h2>
      <ul className="flex flex-col">
        {day.entries.map((entry) => (
          <HistoryRow
            key={entry.id}
            entry={entry}
            selected={entry.id === selected}
            dimmed={open && entry.id !== selected}
            onOpen={onOpen}
          />
        ))}
      </ul>
    </section>
  ));
}
