import type { HistoryStatus } from "@getahoy/protocol";
import {
  Ban,
  Check,
  CircleX,
  type LucideIcon,
  MessageCircleQuestion,
  Minus,
} from "lucide-react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { cn } from "../lib/cn.ts";

type Finished = Exclude<HistoryStatus, "running">;

const marks: Record<Finished, { icon: LucideIcon; tone: string }> = {
  done: { icon: Check, tone: "text-kelp" },
  choice: { icon: MessageCircleQuestion, tone: "text-kelp" },
  failed: { icon: CircleX, tone: "text-flare" },
  blocked: { icon: Ban, tone: "text-driftwood" },
  cancelled: { icon: Minus, tone: "text-driftwood" },
};

export function StatusMark({ status }: { status: HistoryStatus }) {
  const label = historyCopy.status[status];
  if (status === "running") {
    return (
      <span
        role="img"
        aria-label={label}
        className="flex size-4 items-center justify-center"
      >
        <span className="size-2 animate-breathe rounded-pill bg-ink motion-reduce:animate-none" />
      </span>
    );
  }
  const { icon: Icon, tone } = marks[status];
  return (
    <Icon
      role="img"
      aria-label={label}
      strokeWidth={1.75}
      className={cn("size-4 shrink-0", tone)}
    />
  );
}
