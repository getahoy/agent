import { useRef } from "react";
import { agentCopy } from "../../copy/agentCopy.ts";
import { useAgentState } from "../hooks/useAgentState.ts";
import { usePopoverHeight } from "../hooks/usePopoverHeight.ts";
import { PopoverContent } from "./popoverContent.tsx";

export function PopoverApp() {
  const state = useAgentState();
  const panel = useRef<HTMLDivElement>(null);
  usePopoverHeight(panel);
  return (
    <div
      ref={panel}
      className="flex w-popover flex-col gap-2.5 rounded-popover bg-material p-3 text-ink"
    >
      {state ? (
        <PopoverContent state={state} />
      ) : (
        <p aria-busy="true" className="p-2 text-driftwood text-ui">
          {agentCopy.loading}
        </p>
      )}
    </div>
  );
}
