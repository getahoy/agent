import type { HistoryFilter, HistoryPage } from "@getahoy/protocol";
import type {
  HistoryFailure,
  MacHistoryQuery,
} from "../../core/appState/historyBridge.ts";

export type ListPhase = "loading" | "ready" | "failed";

export type HistoryListView = { filter: HistoryFilter; search: string };

export type MacListState = Omit<HistoryPage, "cursor"> & {
  phase: ListPhase;
  cursor: string | null;
  viewKey: string;
  failure: HistoryFailure | null;
  stale: boolean;
  loadingMore: boolean;
};

export const viewKeyOf = ({ filter, search }: HistoryListView) =>
  JSON.stringify([filter, search.trim()]);

export const loadingState = (view: HistoryListView): MacListState => ({
  entries: [],
  summary: null,
  cursor: null,
  viewKey: viewKeyOf(view),
  phase: "loading",
  failure: null,
  stale: false,
  loadingMore: false,
});

export function queryOf(
  view: HistoryListView,
  cursor: string | null,
): MacHistoryQuery {
  const search = view.search.trim();
  return {
    status: view.filter,
    ...(search ? { q: search } : {}),
    ...(cursor ? { cursor } : {}),
  };
}

export function failedState(
  shown: MacListState,
  viewKey: string,
  failure: HistoryFailure,
): MacListState {
  if (shown.viewKey === viewKey && shown.phase === "ready") {
    return { ...shown, stale: true };
  }
  const empty = { entries: [], summary: null, cursor: null };
  return { ...shown, ...empty, viewKey, phase: "failed", failure };
}

export function loadedState(page: HistoryPage, viewKey: string): MacListState {
  const settled = { failure: null, stale: false, loadingMore: false };
  return { ...page, ...settled, viewKey, phase: "ready" };
}

export function appendedState(shown: MacListState, page: HistoryPage) {
  const entries = [...shown.entries, ...page.entries];
  return { ...shown, entries, cursor: page.cursor, loadingMore: false };
}
