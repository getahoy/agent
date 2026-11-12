import { useSpinnerVisible } from "@getahoy/lib";
import { RotateCw } from "lucide-react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { cn } from "../lib/cn.ts";

type HistoryRefreshProps = { refreshing: boolean; onRefresh: () => void };

export function HistoryRefresh({ refreshing, onRefresh }: HistoryRefreshProps) {
  const spinning = useSpinnerVisible(refreshing);
  return (
    <button
      type="button"
      aria-label={historyCopy.refresh}
      title={historyCopy.refreshHint}
      aria-busy={refreshing}
      disabled={refreshing}
      onClick={onRefresh}
      className="flex size-7 cursor-default items-center justify-center rounded-pill text-driftwood hover:bg-linen disabled:hover:bg-transparent"
    >
      <RotateCw
        aria-hidden="true"
        strokeWidth={1.75}
        className={cn(
          "size-4",
          spinning &&
            "animate-qr-spin motion-reduce:animate-none motion-reduce:opacity-40",
        )}
      />
    </button>
  );
}
