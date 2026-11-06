import { useCallback, useState } from "react";

export function useClearHistory() {
  const [clearing, setClearing] = useState(false);
  const clear = useCallback(async () => {
    setClearing(true);
    const reply = await window.ahoy.clearHistory();
    setClearing(false);
    return reply.kind === "ok";
  }, []);
  return { clear, clearing };
}
