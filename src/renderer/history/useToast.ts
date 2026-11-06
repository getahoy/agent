import { useCallback, useEffect, useRef, useState } from "react";

const TOAST_MS = 3000;

export type Toast = { text: string; undo: (() => void) | null };

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const show = useCallback(
    (next: Toast) => {
      stop();
      setToast(next);
      timer.current = setTimeout(() => setToast(null), TOAST_MS);
    },
    [stop],
  );

  const dismiss = useCallback(() => {
    stop();
    setToast(null);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { toast, show, dismiss };
}
