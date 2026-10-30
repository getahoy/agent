import { useEffect, useRef, useState } from "react";

const SPINNER_DELAY_MS = 300;
const SPINNER_MINIMUM_MS = 500;

export function useSpinner(pending: boolean): boolean {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (pending) {
      const show = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, SPINNER_DELAY_MS);
      return () => clearTimeout(show);
    }
    const remaining = SPINNER_MINIMUM_MS - (Date.now() - shownAt.current);
    const hide = setTimeout(() => setVisible(false), Math.max(0, remaining));
    return () => clearTimeout(hide);
  }, [pending]);

  return visible;
}
