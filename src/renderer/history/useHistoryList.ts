import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "react-haiku";
import {
  failedState,
  type HistoryListView,
  loadedState,
  loadingState,
  queryOf,
  viewKeyOf,
} from "./historyListState.ts";
import { useHistoryMore } from "./useHistoryMore.ts";

const SEARCH_DELAY_MS = 300;

export function useHistoryList(view: HistoryListView) {
  const search = useDebounce(view.search, SEARCH_DELAY_MS);
  const { filter } = view;
  const settled = useMemo(() => ({ filter, search }), [filter, search]);
  const [state, setState] = useState(() => loadingState(settled));
  const latest = useRef(0);

  const reload = useCallback(async () => {
    const request = ++latest.current;
    const viewKey = viewKeyOf(settled);
    const reply = await window.ahoy.loadHistory(queryOf(settled, null));
    if (request !== latest.current) return;
    if (reply.kind === "failed") {
      setState((shown) => failedState(shown, viewKey, reply.failure));
      return;
    }
    setState(loadedState(reply.data, viewKey));
  }, [settled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const loadMore = useHistoryMore({ state, setState, settled, latest });
  return { ...state, settled, reload, loadMore };
}
