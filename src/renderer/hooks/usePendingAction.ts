import { useState } from "react";

export function usePendingAction<Input extends unknown[]>(
  action: (...input: Input) => Promise<void>,
): [run: (...input: Input) => void, pending: boolean] {
  const [pending, setPending] = useState(false);
  const run = (...input: Input) => {
    setPending(true);
    void action(...input).finally(() => setPending(false));
  };
  return [run, pending];
}
