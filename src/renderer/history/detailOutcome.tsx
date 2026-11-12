import { type StatusTone, statusTone, whereLine, whyOf } from "@getahoy/lib";
import type { HistoryEntry } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { cn } from "../lib/cn.ts";
import { DetailEyebrow } from "./detailEyebrow.tsx";
import { StatusMark } from "./statusMark.tsx";

const toneClasses: Record<StatusTone, string> = {
  ink: "text-ink",
  kelp: "text-kelp",
  flare: "text-flare",
  driftwood: "text-driftwood",
};

export function DetailOutcome({ entry }: { entry: HistoryEntry }) {
  const where = whereLine(entry);
  const why = whyOf(entry, historyCopy.why);
  return (
    <>
      <section className="flex flex-col gap-1.5">
        <span
          className={cn(
            "flex items-center gap-1.5 font-medium font-mono text-label uppercase",
            toneClasses[statusTone(entry.status)],
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
