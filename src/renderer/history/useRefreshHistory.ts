import { HISTORY_KEY, historyKey } from "@getahoy/lib";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { toast } from "../components/ui/toast.tsx";
import type { ListView } from "./historyQueries.ts";

const REFRESH_KEY = "r";
const NO_FAILURE = -1;

type RefreshOptions = { view: ListView; showing: boolean };

// A failed manual refresh toasts only over a shown list; failedAt lets the page skip the stale line.
export function useRefreshHistory({ view, showing }: RefreshOptions) {
  const client = useQueryClient();
  const running = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [failedAt, setFailedAt] = useState(NO_FAILURE);
  const refresh = async () => {
    if (running.current) return;
    running.current = true;
    setRefreshing(true);
    await client.invalidateQueries({ queryKey: HISTORY_KEY });
    running.current = false;
    setRefreshing(false);
    const state = client.getQueryState(historyKey(view));
    if (state?.status !== "error") return;
    setFailedAt(state.errorUpdatedAt);
    if (showing) toast(historyCopy.couldNotRefresh);
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
  return { refreshing, refresh, failedAt };
}
