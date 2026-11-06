import { useMutation, useQueryClient } from "@tanstack/react-query";
import { historyCopy } from "../../copy/historyCopy.ts";
import {
  dropFinished,
  HISTORY_KEY,
  HistoryLoadError,
  type HistoryPages,
  withoutEntry,
} from "./historyQueries.ts";
import type { Toast } from "./useToast.ts";

async function remove(id: string) {
  const reply = await window.ahoy.removeHistoryEntry(id);
  if (reply.kind === "failed") throw new HistoryLoadError(reply.failure);
}

async function restore(id: string) {
  const reply = await window.ahoy.restoreHistoryEntry(id);
  if (reply.kind === "failed") throw new HistoryLoadError(reply.failure);
}

// The row leaves every cached list at once; a failure puts the lists back as they were.
export function useDeleteEntry(show: (toast: Toast) => void) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: HISTORY_KEY });
  const undo = useMutation({ mutationFn: restore, onSettled: refresh });
  return useMutation({
    mutationFn: remove,
    onMutate: async (id: string) => {
      await client.cancelQueries({ queryKey: HISTORY_KEY });
      const before = client.getQueriesData<HistoryPages>({
        queryKey: HISTORY_KEY,
      });
      client.setQueriesData<HistoryPages>({ queryKey: HISTORY_KEY }, (pages) =>
        pages ? withoutEntry(pages, id) : pages,
      );
      dropFinished(client, id);
      return { before };
    },
    onError: (_error, _id, context) => {
      for (const [key, pages] of context?.before ?? []) {
        client.setQueryData(key, pages);
      }
      show({ text: historyCopy.couldNotDelete, undo: null });
    },
    onSuccess: (_done, id) =>
      show({ text: historyCopy.deleted, undo: () => undo.mutate(id) }),
  });
}
