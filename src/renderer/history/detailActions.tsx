import type { HistoryEntry } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { Button } from "../components/ui/button.tsx";

export type EntryHandlers = {
  running: boolean;
  onRunAgain: (entry: HistoryEntry) => void;
  onCopy: (entry: HistoryEntry) => void;
  onReport: (entry: HistoryEntry) => void;
  onDelete: (entry: HistoryEntry) => void;
};

type DetailActionsProps = EntryHandlers & { entry: HistoryEntry };

export function DetailActions({ entry, ...handlers }: DetailActionsProps) {
  const runnable = entry.status !== "blocked";
  return (
    <div className="flex flex-col gap-2">
      {runnable ? (
        <Button
          variant="secondary"
          width="full"
          pending={handlers.running}
          onClick={() => handlers.onRunAgain(entry)}
        >
          {handlers.running ? historyCopy.runningAgain : historyCopy.runAgain}
        </Button>
      ) : null}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => handlers.onCopy(entry)}
        >
          {historyCopy.copy}
        </Button>
        <Button
          variant="secondary"
          className="flex-2"
          onClick={() => handlers.onReport(entry)}
        >
          {historyCopy.report}
        </Button>
        <Button
          variant="quietDestructive"
          className="flex-1"
          onClick={() => handlers.onDelete(entry)}
        >
          {historyCopy.delete}
        </Button>
      </div>
    </div>
  );
}
