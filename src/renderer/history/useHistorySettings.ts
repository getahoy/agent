import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { resetHistory } from "./historyQueries.ts";

export function useHistorySettings() {
  const client = useQueryClient();
  const [keepHistory, setKeepHistory] = useState<boolean | null>(null);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    void window.ahoy.historySettings().then((reply) => {
      if (reply.kind === "ok") setKeepHistory(reply.data.keepHistory);
    });
  }, []);

  const change = useCallback(
    async (on: boolean) => {
      setChanging(true);
      const reply = await window.ahoy.changeHistorySettings(on);
      setChanging(false);
      if (reply.kind !== "ok") return false;
      setKeepHistory(reply.data.keepHistory);
      if (!reply.data.keepHistory) resetHistory(client);
      return true;
    },
    [client],
  );

  return { keepHistory, changing, change };
}
