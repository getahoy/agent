import { useState } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { toast } from "../components/ui/toast.tsx";
import { useClearHistory } from "./useClearHistory.ts";

export function useClearAll() {
  const { clear, clearing } = useClearHistory();
  const [cleared, setCleared] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const clearAll = async () => {
    const done = await clear();
    setConfirming(false);
    if (done) setCleared(true);
    else toast(historyCopy.couldNotClear);
  };

  return { cleared, confirming, setConfirming, clearing, clearAll };
}
