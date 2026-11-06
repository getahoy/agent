import { useCallback, useState } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { useClearHistory } from "./useClearHistory.ts";
import type { Toast } from "./useToast.ts";

type ClearAllOptions = {
  reload: () => Promise<void>;
  show: (toast: Toast) => void;
};

export function useClearAll({ reload, show }: ClearAllOptions) {
  const { clear, clearing } = useClearHistory();
  const [cleared, setCleared] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const clearAll = useCallback(async () => {
    const done = await clear();
    setConfirming(false);
    if (done) setCleared(true);
    else show({ text: historyCopy.couldNotClear, undo: null });
    void reload();
  }, [clear, reload, show]);

  return { cleared, confirming, setConfirming, clearing, clearAll };
}
