import type { HistoryEntry } from "@getahoy/protocol";
import { useState } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { needsRunConfirm } from "./historyView.ts";
import type { Toast } from "./useToast.ts";

type EntryDialog = "runAgain" | "report" | null;

type ToolsOptions = { show: (toast: Toast) => void; reload: () => void };

export function useEntryTools({ show, reload }: ToolsOptions) {
  const [dialog, setDialog] = useState<EntryDialog>(null);
  const [running, setRunning] = useState(false);
  const [sending, setSending] = useState(false);
  const toast = (text: string) => show({ text, undo: null });

  const run = async (entry: HistoryEntry) => {
    setDialog(null);
    setRunning(true);
    const ran = await window.ahoy.runHistoryAgain(entry.heard);
    setRunning(false);
    toast(ran.kind === "ok" ? ran.data.message : historyCopy.couldNotRun);
    reload();
  };
  const runAgain = (entry: HistoryEntry) => {
    if (needsRunConfirm(entry.heard)) setDialog("runAgain");
    else void run(entry);
  };
  const report = async (entry: HistoryEntry, note: string) => {
    setSending(true);
    const sent = await window.ahoy.reportHistoryProblem({ id: entry.id, note });
    setSending(false);
    setDialog(null);
    const { reportSent, couldNotReport } = historyCopy;
    toast(sent.kind === "ok" ? reportSent : couldNotReport);
  };
  return { dialog, setDialog, running, sending, run, runAgain, report };
}
