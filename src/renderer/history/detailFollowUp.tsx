import { seconds } from "@getahoy/lib";
import type { HistoryFollowUp } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { cn } from "../lib/cn.ts";
import { DetailEyebrow } from "./detailEyebrow.tsx";

export function DetailFollowUp({ followUp }: { followUp: HistoryFollowUp }) {
  const { waitedMs, said } = followUp;
  const waited = waitedMs === null ? null : seconds(waitedMs);
  return (
    <div className="flex flex-col gap-2 border-rope border-l-2 pl-3.5">
      <DetailEyebrow>{historyCopy.ahoyAsked}</DetailEyebrow>
      <span className="font-display text-question">{followUp.question}</span>
      <ul className="flex flex-col gap-1.5">
        {followUp.options.map((option) => {
          const chosen = option.number === followUp.chosen;
          return (
            <li
              key={option.number}
              className={cn(
                "flex items-center gap-2.5 text-ui",
                chosen ? "text-ink" : "text-driftwood",
              )}
            >
              <span
                className={cn(
                  "flex size-5 -skew-x-10 items-center justify-center rounded-row font-medium font-mono text-caption text-on-tag",
                  chosen ? "bg-signal" : "bg-fog",
                )}
              >
                <span className="skew-x-10">{option.number}</span>
              </span>
              {option.label}
            </li>
          );
        })}
      </ul>
      {said === null ? null : (
        <span className="mt-1.5 flex flex-col gap-2">
          <DetailEyebrow>{historyCopy.youSaid(waited)}</DetailEyebrow>
          <span className="font-display text-question italic">“{said}”</span>
        </span>
      )}
    </div>
  );
}
