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
import type {
  HistoryFailure,
  MacHistoryQuery,
} from "../../core/appState/historyBridge.ts";

const STALE_MS = 30_000;
const FIRST_PAGE: string | null = null;

export const HISTORY_KEY = ["history"] as const;
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

function queryOf({ filter, search }: ListView, cursor: string | null) {
  const query: MacHistoryQuery = { status: filter };
  if (search) query.q = search;
  if (cursor) query.cursor = cursor;
  return query;
}

async function loadPage(view: ListView, cursor: string | null) {
  const reply = await window.ahoy.loadHistory(queryOf(view, cursor));
  if (reply.kind === "failed") throw new HistoryLoadError(reply.failure);
  return reply.data;
}

export const historyKey = (view: ListView) =>
  [...HISTORY_KEY, view.filter, view.search] as const;

export function useHistoryQuery(view: ListView) {
  return useInfiniteQuery({
    queryKey: historyKey(view),
    queryFn: ({ pageParam }) => loadPage(view, pageParam),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (last) => last.cursor,
    staleTime: STALE_MS,
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

export function withoutEntry(pages: HistoryPages, id: string): HistoryPages {
  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      entries: page.entries.filter((entry) => entry.id !== id),
    })),
  };
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
