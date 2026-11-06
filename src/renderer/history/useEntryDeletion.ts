import { useCallback, useState } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import type { Toast } from "./useToast.ts";

type DeletionOptions = {
  reload: () => Promise<void>;
  show: (toast: Toast) => void;
};

function without(ids: ReadonlySet<string>, id: string) {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

// The row leaves at once; Undo puts it back for as long as the toast is up.
export function useEntryDeletion({ reload, show }: DeletionOptions) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());

  const deleteEntry = useCallback(
    async (id: string) => {
      setHidden((ids) => new Set(ids).add(id));
      const deleted = await window.ahoy.removeHistoryEntry(id);
      if (deleted.kind === "failed") {
        setHidden((ids) => without(ids, id));
        show({ text: historyCopy.couldNotDelete, undo: null });
        return;
      }
      const undo = () =>
        void window.ahoy.restoreHistoryEntry(id).then(() => {
          setHidden((ids) => without(ids, id));
          void reload();
        });
      show({ text: historyCopy.deleted, undo });
    },
    [reload, show],
  );

  return { hidden, deleteEntry };
}
