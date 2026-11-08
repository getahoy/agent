import { useEffect, useState } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { toast } from "../components/ui/toast.tsx";
import { useClearHistory } from "./useClearHistory.ts";

// "History cleared" is for the moment after clearing; the first new entry ends it.
export function useClearAll(hasEntries: boolean) {
  const { clear, clearing } = useClearHistory();
  const [cleared, setCleared] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (hasEntries) setCleared(false);
  }, [hasEntries]);

  const clearAll = async () => {
    const done = await clear();
    setConfirming(false);
    if (done) setCleared(true);
    else toast(historyCopy.couldNotClear);
  };

  return { cleared, confirming, setConfirming, clearing, clearAll };
}
