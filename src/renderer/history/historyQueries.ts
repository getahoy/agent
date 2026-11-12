import {
  HISTORY_KEY,
  HISTORY_STALE_MS,
  historyKey,
  queryOf,
} from "@getahoy/lib";
import type {
  HistoryEntry,
  HistoryFilter,
  HistoryPage,
} from "@getahoy/protocol";
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import type { HistoryFailure } from "../../core/appState/historyBridge.ts";

const FIRST_PAGE: string | null = null;

const FINISHED_KEY = ["historyFinished"] as const;

export type ListView = { filter: HistoryFilter; search: string };

export type HistoryPages = InfiniteData<HistoryPage>;

// The query library learns of a failure only from a throw; the bridge's failure kind rides along.
export class HistoryLoadError extends Error {
  readonly failure: HistoryFailure;
  constructor(failure: HistoryFailure) {
    super(failure);
    this.failure = failure;
  }
}

async function loadPage(view: ListView, cursor: string | null) {
  const reply = await window.ahoy.loadHistory(queryOf(view, cursor));
  if (reply.kind === "failed") throw new HistoryLoadError(reply.failure);
  return reply.data;
}

export function useHistoryQuery(view: ListView) {
  return useInfiniteQuery({
    queryKey: historyKey(view),
    queryFn: ({ pageParam }) => loadPage(view, pageParam),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (last) => last.cursor,
    staleTime: HISTORY_STALE_MS,
  });
}

export function useFinishedEntries(): HistoryEntry[] {
  const finished = useQuery<HistoryEntry[]>({
    queryKey: FINISHED_KEY,
    queryFn: () => [],
    initialData: [],
    enabled: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  return finished.data;
}

export function addFinished(client: QueryClient, entry: HistoryEntry) {
  client.setQueryData<HistoryEntry[]>(FINISHED_KEY, (shown = []) => [
    entry,
    ...shown.filter((kept) => kept.id !== entry.id),
  ]);
  void client.invalidateQueries({ queryKey: HISTORY_KEY });
}

export function dropFinished(client: QueryClient, id: string) {
  client.setQueryData<HistoryEntry[]>(FINISHED_KEY, (shown = []) =>
    shown.filter((entry) => entry.id !== id),
  );
}

export function resetHistory(client: QueryClient) {
  client.setQueryData<HistoryEntry[]>(FINISHED_KEY, []);
  void client.resetQueries({ queryKey: HISTORY_KEY });
}
