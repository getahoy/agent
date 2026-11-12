import { seconds, type TimingSegment, timingSegments } from "@getahoy/lib";
import type { HistoryTimings } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { cn } from "../lib/cn.ts";
import { DetailEyebrow } from "./detailEyebrow.tsx";

// Class names must be written out whole for the style compiler to find them.
const SHARES = [
  "grow-1",
  "grow-2",
  "grow-3",
  "grow-4",
  "grow-5",
  "grow-6",
  "grow-7",
  "grow-8",
  "grow-9",
  "grow-10",
  "grow-11",
  "grow-12",
] as const;

const swatches: Record<TimingSegment["tone"], string> = {
  ink: "bg-ink",
  driftwood: "bg-driftwood",
  fog: "bg-fog",
};

function shareOf(ms: number, total: number): string {
  const step = Math.max(1, Math.round((ms / total) * SHARES.length));
  return SHARES[step - 1] ?? "grow-1";
}

export function DetailTimings({ timings }: { timings: HistoryTimings }) {
  const segments = timingSegments(timings);
  const total = segments.reduce((sum, segment) => sum + segment.ms, 0);
  if (total === 0) return null;
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <DetailEyebrow>{historyCopy.timeWent}</DetailEyebrow>
        <span className="font-medium font-mono text-caption">
          {seconds(total)}s
        </span>
      </div>
      <div aria-hidden="true" className="flex h-1.5 gap-0.75">
        {segments.map(({ label, tone, ms }) => (
          <span
            key={label}
            className={cn(
              "basis-0 rounded-pill",
              swatches[tone],
              shareOf(ms, total),
            )}
          />
        ))}
      </div>
      <ul className="flex flex-col gap-1">
        {segments.map(({ label, tone, ms }) => (
          <li key={label} className="flex items-center gap-2 text-ui">
            <span className={cn("size-2 rounded-xs", swatches[tone])} />
            <span className="flex-1">{label}</span>
            <span className="font-medium font-mono text-caption text-driftwood">
              {seconds(ms)}s
            </span>
          </li>
        ))}
      </ul>
      {timings.waitedMs ? (
        <span className="text-caption text-driftwood">
          {historyCopy.waitedNote(seconds(timings.waitedMs))}
        </span>
      ) : null}
    </section>
  );
}
