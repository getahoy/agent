import type { HistoryEntry, HistoryFilter } from "@getahoy/protocol";
import { useState } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { pageView } from "./historyPageView.ts";
import { useClearAll } from "./useClearAll.ts";
import { useEntryDeletion } from "./useEntryDeletion.ts";
import { useHistoryList } from "./useHistoryList.ts";
import { useHistorySettings } from "./useHistorySettings.ts";
import { useToast } from "./useToast.ts";

function useListView() {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  return { filter, search, selected, setFilter, setSearch, setSelected };
}

export function useHistoryPage() {
  const view = useListView();
  const list = useHistoryList(view);
  const toasts = useToast();
  const { reload } = list;
  const { show } = toasts;
  const { hidden, deleteEntry } = useEntryDeletion({ reload, show });
  const { keepHistory } = useHistorySettings();
  const clearing = useClearAll({ reload, show });
  const { cleared } = clearing;
  const shown = pageView({ list, ...view, hidden, keepHistory, cleared });
  const selected =
    shown.entries.find((entry) => entry.id === view.selected) ?? null;
  const copy = (entry: HistoryEntry) => {
    const text = historyCopy.copiedText(entry.heard, entry.did);
    const copied = { text: historyCopy.copied, undo: null };
    void navigator.clipboard.writeText(text).then(() => show(copied));
  };
  const deleteSelected = (entry: HistoryEntry) => {
    view.setSelected(null);
    void deleteEntry(entry.id);
  };
  const undo = () => {
    toasts.toast?.undo?.();
    toasts.dismiss();
  };
  const actions = { copy, deleteSelected, undo };
  return { view, list, toasts, selected, ...shown, ...clearing, ...actions };
}
