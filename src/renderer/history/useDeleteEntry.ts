import { useMutation, useQueryClient } from "@tanstack/react-query";
import { historyCopy } from "../../copy/historyCopy.ts";
import { toast } from "../components/ui/toast.tsx";
import {
  dropFinished,
  HISTORY_KEY,
  HistoryLoadError,
  type HistoryPages,
  withoutEntry,
} from "./historyQueries.ts";

async function remove(id: string) {
  const reply = await window.ahoy.removeHistoryEntry(id);
  if (reply.kind === "failed") throw new HistoryLoadError(reply.failure);
}

async function restore(id: string) {
  const reply = await window.ahoy.restoreHistoryEntry(id);
  if (reply.kind === "failed") throw new HistoryLoadError(reply.failure);
}

// The row leaves every cached list at once; a failure puts the lists back as they were.
export function useDeleteEntry() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: HISTORY_KEY });
  const undo = useMutation({
    mutationFn: restore,
    onError: () => toast(historyCopy.couldNotUndo),
    onSettled: refresh,
  });
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
      toast(historyCopy.couldNotDelete);
    },
    onSuccess: (_done, id) =>
      toast(historyCopy.deleted, {
        label: historyCopy.undo,
        onAction: () => undo.mutate(id),
      }),
  });
}
