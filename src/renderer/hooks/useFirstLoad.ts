import { useEffect, useState } from "react";
import { useSpinner } from "./useSpinner.ts";

// The waiting state keeps its place until its own spinner may leave, so it never flickers.
export function useFirstLoad(waiting: boolean) {
  const held = useSpinner(waiting);
  const showLoader = waiting || held;
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (showLoader) setWaited(true);
  }, [showLoader]);

  return { busy: waiting, showLoader, fadeIn: waited && !showLoader };
}
