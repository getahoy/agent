import type { HistoryEntry } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { ConfirmDialog } from "../components/ui/confirmDialog.tsx";
import { ReportDialog } from "./reportDialog.tsx";
import type { useEntryTools } from "./useEntryTools.ts";

type EntryDialogsProps = {
  entry: HistoryEntry | null;
  tools: ReturnType<typeof useEntryTools>;
};

export function EntryDialogs({ entry, tools }: EntryDialogsProps) {
  if (!entry) return null;
  const toggle = (open: boolean) => {
    if (!open) tools.setDialog(null);
  };
  return (
    <>
      <ConfirmDialog
        open={tools.dialog === "runAgain"}
        title={historyCopy.confirmRunTitle}
        body={historyCopy.confirmRunBody(entry.heard)}
        confirmLabel={historyCopy.confirmRun}
        cancelLabel={historyCopy.cancel}
        pending={tools.running}
        onConfirm={() => void tools.run(entry)}
        onOpenChange={toggle}
      />
      <ReportDialog
        key={entry.id}
        entry={entry}
        open={tools.dialog === "report"}
        sending={tools.sending}
        onSend={(note) => void tools.report(entry, note)}
        onOpenChange={toggle}
      />
    </>
  );
}
