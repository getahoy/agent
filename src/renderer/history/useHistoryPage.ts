import type { HistoryEntry, HistoryFilter } from "@getahoy/protocol";
import { useState } from "react";
import { useDebounce } from "react-haiku";
import { historyCopy } from "../../copy/historyCopy.ts";
import { useFirstLoad } from "../hooks/useFirstLoad.ts";
import { pageView } from "./historyPageView.ts";
import { useFinishedEntries, useHistoryQuery } from "./historyQueries.ts";
import { useClearAll } from "./useClearAll.ts";
import { useDeleteEntry } from "./useDeleteEntry.ts";
import { useHistorySettings } from "./useHistorySettings.ts";
import { useToast } from "./useToast.ts";

const SEARCH_DELAY_MS = 300;

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
  const search = useDebounce(view.search, SEARCH_DELAY_MS).trim();
  const settled = { filter: view.filter, search };
  const query = useHistoryQuery(settled);
  const overall = useHistoryQuery({ filter: "all", search: "" });
  const finished = useFinishedEntries();
  const toasts = useToast();
  const { show } = toasts;
  const deletion = useDeleteEntry(show);
  const { keepHistory } = useHistorySettings();
  const clearing = useClearAll(show);
  const shown = pageView({
    view: settled,
    pages: query.data,
    summary: overall.data?.pages[0]?.summary ?? null,
    finished,
    pending: query.isPending,
    error: query.error,
    keepHistory,
    cleared: clearing.cleared,
  });
  const firstLoad = useFirstLoad(query.isPending && finished.length === 0);
  const selected =
    shown.entries.find((entry) => entry.id === view.selected) ?? null;
  const copy = (entry: HistoryEntry) => {
    const text = historyCopy.copiedText(entry.heard, entry.did);
    const copied = { text: historyCopy.copied, undo: null };
    void navigator.clipboard.writeText(text).then(() => show(copied));
  };
  const deleteSelected = (entry: HistoryEntry) => {
    view.setSelected(null);
    deletion.mutate(entry.id);
  };
  const undo = () => {
    toasts.toast?.undo?.();
    toasts.dismiss();
  };
  const actions = { copy, deleteSelected, undo };
  const state = { view, query, toasts, selected, firstLoad };
  return { ...state, ...shown, ...clearing, ...actions };
}
