import { HISTORY_SEARCH_DELAY_MS } from "@getahoy/lib";
import type { HistoryEntry, HistoryFilter } from "@getahoy/protocol";
import { useState } from "react";
import { useDebounce } from "react-haiku";
import { historyCopy } from "../../copy/historyCopy.ts";
import { toast } from "../components/ui/toast.tsx";
import { useFirstLoad } from "../hooks/useFirstLoad.ts";
import { pageView } from "./historyPageView.ts";
import { useFinishedEntries, useHistoryQuery } from "./historyQueries.ts";
import { useClearAll } from "./useClearAll.ts";
import { useDeleteEntry } from "./useDeleteEntry.ts";
import { useHistorySettings } from "./useHistorySettings.ts";
import { useRefreshHistory } from "./useRefreshHistory.ts";

function useListView() {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const close = () => {
    setSelected(null);
    if (selected) focusRow(selected);
  };
  const open = (id: string) => (id === selected ? close() : setSelected(id));
  return {
    filter,
    search,
    selected,
    setFilter,
    setSearch,
    setSelected,
    open,
    close,
  };
}

function focusRow(id: string) {
  const row = `[data-entry-id="${CSS.escape(id)}"]`;
  document.querySelector<HTMLElement>(row)?.focus();
}

export function useHistoryPage() {
  const view = useListView();
  const search = useDebounce(view.search, HISTORY_SEARCH_DELAY_MS).trim();
  const settled = { filter: view.filter, search };
  const query = useHistoryQuery(settled);
  const overall = useHistoryQuery({ filter: "all", search: "" });
  const finished = useFinishedEntries();
  const deletion = useDeleteEntry();
  const { keepHistory } = useHistorySettings();
  const pages = query.data?.pages ?? [];
  const listed = pages.some((page) => page.entries.length > 0);
  const clearing = useClearAll(listed || finished.length > 0);
  const showing = query.data !== undefined;
  const refreshing = useRefreshHistory({ view: settled, showing });
  const shown = pageView({
    view: settled,
    pages: query.data,
    summary: overall.data?.pages[0]?.summary ?? null,
    summaryPending: !overall.data && overall.fetchStatus === "fetching",
    finished,
    pending: query.isPending,
    error: query.error,
    manualFailure: query.errorUpdatedAt === refreshing.failedAt,
    keepHistory,
    cleared: clearing.cleared,
  });
  const firstLoad = useFirstLoad(query.isPending && finished.length === 0);
  const selected =
    shown.entries.find((entry) => entry.id === view.selected) ?? null;
  const copy = (entry: HistoryEntry) => {
    const text = historyCopy.copiedText(entry.heard, entry.did);
    void navigator.clipboard
      .writeText(text)
      .then(() => toast(historyCopy.copied));
  };
  const deleteSelected = (entry: HistoryEntry) => {
    view.setSelected(null);
    deletion.mutate(entry.id);
  };
  const actions = { copy, deleteSelected };
  const state = { view, query, selected, firstLoad };
  return { ...state, ...shown, ...clearing, ...refreshing, ...actions };
}
