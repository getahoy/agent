import { useSpinnerVisible } from "@getahoy/lib";
import { useEffect, useState } from "react";

// The waiting state keeps its place until its own spinner may leave, so it never flickers.
export function useFirstLoad(waiting: boolean) {
  const held = useSpinnerVisible(waiting);
  const showLoader = waiting || held;
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (showLoader) setWaited(true);
  }, [showLoader]);

  return { busy: waiting, showLoader, fadeIn: waited && !showLoader };
}
