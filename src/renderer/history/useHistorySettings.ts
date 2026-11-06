import { useCallback, useEffect, useState } from "react";

export function useHistorySettings() {
  const [keepHistory, setKeepHistory] = useState<boolean | null>(null);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    void window.ahoy.historySettings().then((reply) => {
      if (reply.kind === "ok") setKeepHistory(reply.data.keepHistory);
    });
  }, []);

  const change = useCallback(async (on: boolean) => {
    setChanging(true);
    const reply = await window.ahoy.changeHistorySettings(on);
    setChanging(false);
    if (reply.kind === "ok") setKeepHistory(reply.data.keepHistory);
    return reply.kind === "ok";
  }, []);

  return { keepHistory, changing, change };
}
