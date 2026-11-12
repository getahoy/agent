import { Dialog } from "@base-ui/react/dialog";
import { reportLines } from "@getahoy/lib";
import { type HistoryEntry, MAX_REPORT_NOTE_CHARS } from "@getahoy/protocol";
import { useState } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { Button } from "../components/ui/button.tsx";

type ReportDialogProps = {
  entry: HistoryEntry;
  open: boolean;
  sending: boolean;
  onSend: (note: string) => void;
  onOpenChange: (open: boolean) => void;
};

export function ReportDialog(props: ReportDialogProps) {
  const [note, setNote] = useState("");
  return (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-scrim transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-50 m-auto flex h-fit w-report flex-col gap-3 rounded-dialog bg-material-dialog px-4.5 pt-5 pb-4 shadow-dialog outline-none backdrop-blur-dialog transition-opacity duration-240 data-ending-style:opacity-0 data-starting-style:opacity-0">
          <Dialog.Title className="font-medium text-dialog-title">
            {historyCopy.report}
          </Dialog.Title>
          <Dialog.Description className="text-dialog-body text-driftwood">
            {historyCopy.reportBody}
          </Dialog.Description>
          <dl className="flex flex-col gap-1.5 rounded-thumb bg-paper p-3 text-caption">
            {reportLines(props.entry).map((line) => (
              <div key={line.label} className="flex flex-col">
                <dt className="font-medium font-mono text-driftwood text-micro uppercase">
                  {line.label}
                </dt>
                <dd>{line.text}</dd>
              </div>
            ))}
          </dl>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={MAX_REPORT_NOTE_CHARS}
            aria-label={historyCopy.reportNote}
            placeholder={historyCopy.reportNote}
            className="min-h-16 resize-none rounded-thumb border border-rope bg-paper px-3 py-2 text-ui outline-none placeholder:text-fog focus:border-signal"
          />
          <div className="flex gap-2">
            <Dialog.Close
              render={<Button variant="secondary" className="flex-1" />}
            >
              {historyCopy.cancel}
            </Dialog.Close>
            <Button
              className="flex-1"
              pending={props.sending}
              onClick={() => props.onSend(note)}
            >
              {historyCopy.reportSend}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
