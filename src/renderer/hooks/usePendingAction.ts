import { useState } from "react";

export function usePendingAction(
  action: () => Promise<void>,
): [run: () => void, pending: boolean] {
  const [pending, setPending] = useState(false);
  const run = () => {
    setPending(true);
    void action().finally(() => setPending(false));
  };
  return [run, pending];
}
