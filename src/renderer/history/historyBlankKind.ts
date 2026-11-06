import type { HistoryFilter } from "@getahoy/protocol";
import type { HistoryFailure } from "../../core/appState/historyBridge.ts";
import type { ListPhase } from "./historyListState.ts";

export type BlankKind =
  | "loading"
  | "error"
  | "signedOut"
  | "off"
  | "cleared"
  | "noMatch"
  | "nothingFailed"
  | "empty";

type BlankInput = {
  phase: ListPhase;
  failure: HistoryFailure | null;
  keepHistory: boolean | null;
  cleared: boolean;
  count: number;
  filter: HistoryFilter;
  search: string;
};

export function blankFor(input: BlankInput): BlankKind | null {
  if (input.keepHistory === false) return "off";
  if (input.count > 0) return null;
  if (input.phase === "loading") return "loading";
  if (input.phase === "failed") {
    return input.failure === "signedOut" ? "signedOut" : "error";
  }
  if (input.search.trim()) return "noMatch";
  if (input.filter === "failed") return "nothingFailed";
  return input.cleared ? "cleared" : "empty";
}
