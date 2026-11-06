import { useEffect, useState } from "react";

export function useElapsedOver(active: boolean, limitMs: number): boolean {
  const [over, setOver] = useState(false);

  useEffect(() => {
    setOver(false);
    if (!active) return;
    const timer = setTimeout(() => setOver(true), limitMs);
    return () => clearTimeout(timer);
  }, [active, limitMs]);

  return active && over;
}
