import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { HISTORY_KEY, historyKey, type ListView } from "./historyQueries.ts";
import type { Toast } from "./useToast.ts";

const REFRESH_KEY = "r";

export function useRefreshHistory(
  view: ListView,
  show: (toast: Toast) => void,
) {
  const client = useQueryClient();
  const running = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    if (running.current) return;
    running.current = true;
    setRefreshing(true);
    await client.invalidateQueries({ queryKey: HISTORY_KEY });
    running.current = false;
    setRefreshing(false);
    if (client.getQueryState(historyKey(view))?.status === "error") {
      show({ text: historyCopy.couldNotRefresh, undo: null });
    }
  };
  useEffect(() => {
    const pressed = (event: KeyboardEvent) => {
      if (!event.metaKey || event.key.toLowerCase() !== REFRESH_KEY) return;
      event.preventDefault();
      void refresh();
    };
    window.addEventListener("keydown", pressed);
    return () => window.removeEventListener("keydown", pressed);
  });
  return { refreshing, refresh };
}
