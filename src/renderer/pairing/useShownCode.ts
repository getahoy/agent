import { useRef } from "react";
import { useSpinner } from "../hooks/useSpinner.ts";
import type { CodeStatus } from "./codeView.ts";

const MAKING: ReadonlySet<CodeStatus["kind"]> = new Set([
  "idle",
  "starting",
  "slow",
  "refreshing",
]);

export function useShownCode(status: CodeStatus) {
  const making = MAKING.has(status.kind);
  const spinning = useSpinner(making);
  const lastMaking = useRef(status);
  if (making) lastMaking.current = status;
  const shown = spinning && !making ? lastMaking.current : status;
  return { shown, spinning };
}
