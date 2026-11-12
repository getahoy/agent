import { seconds, totalMs, whyOf } from "@getahoy/lib";
import type { HistoryEntry, HistoryStatus } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { cn } from "../lib/cn.ts";
import { DetailEyebrow } from "./detailEyebrow.tsx";
import { StatusMark } from "./statusMark.tsx";

const statusTones: Record<HistoryStatus, string> = {
  running: "text-ink",
  done: "text-kelp",
  choice: "text-kelp",
  failed: "text-flare",
  blocked: "text-driftwood",
  cancelled: "text-driftwood",
};

export function DetailOutcome({ entry }: { entry: HistoryEntry }) {
  const total = totalMs(entry.timings);
  const took = total === null ? null : seconds(total);
  const where = historyCopy.where(entry.app, took);
  const why = whyOf(entry, historyCopy.why);
  return (
    <>
      <section className="flex flex-col gap-1.5">
        <span
          className={cn(
            "flex items-center gap-1.5 font-medium font-mono text-label uppercase",
            statusTones[entry.status],
          )}
        >
          <StatusMark status={entry.status} />
          {historyCopy.status[entry.status]}
        </span>
        {entry.did ? (
          <span className="font-medium text-outcome">{entry.did}</span>
        ) : null}
        {where ? <span className="text-driftwood text-ui">{where}</span> : null}
      </section>
      {why ? (
        <section className="flex flex-col gap-1 rounded-group bg-sailcloth px-3.5 py-3">
          <DetailEyebrow>{why.label}</DetailEyebrow>
          <span className="text-row">{why.text}</span>
        </section>
      ) : null}
    </>
  );
}
