import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { resetHistory } from "./historyQueries.ts";

export function useClearHistory() {
  const client = useQueryClient();
  const [clearing, setClearing] = useState(false);
  const clear = useCallback(async () => {
    setClearing(true);
    const reply = await window.ahoy.clearHistory();
    setClearing(false);
    if (reply.kind === "ok") resetHistory(client);
    return reply.kind === "ok";
  }, [client]);
  return { clear, clearing };
}
