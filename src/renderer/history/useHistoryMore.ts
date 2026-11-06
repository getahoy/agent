import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
} from "react";
import {
  appendedState,
  type HistoryListView,
  type MacListState,
  queryOf,
} from "./historyListState.ts";

type MoreOptions = {
  state: MacListState;
  setState: Dispatch<SetStateAction<MacListState>>;
  settled: HistoryListView;
  latest: RefObject<number>;
};

export function useHistoryMore(options: MoreOptions) {
  const { state, setState, settled, latest } = options;
  const { cursor, loadingMore } = state;
  return useCallback(async () => {
    if (!cursor || loadingMore) return;
    const request = latest.current;
    setState((shown) => ({ ...shown, loadingMore: true }));
    const reply = await window.ahoy.loadHistory(queryOf(settled, cursor));
    if (request !== latest.current) return;
    setState((shown) =>
      reply.kind === "failed"
        ? { ...shown, loadingMore: false }
        : appendedState(shown, reply.data),
    );
  }, [cursor, loadingMore, settled, setState, latest]);
}
