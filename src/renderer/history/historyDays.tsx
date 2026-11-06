import type { HistoryEntry } from "@getahoy/protocol";
import { HistoryRow } from "./historyRow.tsx";
import { daysOf } from "./historyView.ts";

type HistoryDaysProps = {
  entries: readonly HistoryEntry[];
  selected: string | null;
  onOpen: (id: string) => void;
};

export function HistoryDays({ entries, selected, onOpen }: HistoryDaysProps) {
  return daysOf(entries, new Date()).map((day) => (
    <section key={day.title} aria-label={day.title}>
      <h2 className="px-2.5 pt-4 pb-1 font-display text-entry">{day.title}</h2>
      <ul className="flex flex-col">
        {day.entries.map((entry) => (
          <HistoryRow
            key={entry.id}
            entry={entry}
            selected={entry.id === selected}
            onOpen={onOpen}
          />
        ))}
      </ul>
    </section>
  ));
}
