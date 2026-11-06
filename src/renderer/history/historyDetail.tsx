import type { HistoryEntry, HistoryFollowUp } from "@getahoy/protocol";
import { historyCopy } from "../../copy/historyCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { DetailEyebrow } from "./detailEyebrow.tsx";
import { DetailFollowUp } from "./detailFollowUp.tsx";
import { DetailOutcome } from "./detailOutcome.tsx";
import { DetailTimings } from "./detailTimings.tsx";
import { dayLabel, timeLabel } from "./historyView.ts";

const LONG_HEARD_CHARS = 60;

const understood = {
  ai: { title: historyCopy.viaAi, note: historyCopy.viaAiNote },
  rules: { title: historyCopy.viaRules, note: historyCopy.viaRulesNote },
};

const followUpKey = (followUp: HistoryFollowUp) =>
  [followUp.question, followUp.said, followUp.waitedMs].join("|");

type HistoryDetailProps = {
  entry: HistoryEntry | null;
  onCopy: (entry: HistoryEntry) => void;
  onDelete: (entry: HistoryEntry) => void;
};

export function HistoryDetail({ entry, onCopy, onDelete }: HistoryDetailProps) {
  if (!entry) {
    return (
      <p className="m-auto px-10 text-center text-body-sm text-driftwood">
        {historyCopy.chooseEntry}
      </p>
    );
  }
  const startedAt = new Date(entry.startedAt);
  const day = dayLabel(startedAt, new Date());
  const eyebrow = [day, timeLabel(startedAt), entry.macName].join(" · ");
  const long = entry.heard.length > LONG_HEARD_CHARS;
  const via = entry.via ? understood[entry.via] : null;
  return (
    <article className="flex flex-col gap-6 px-7 pt-9 pb-8">
      <header className="flex flex-col gap-2.5">
        <DetailEyebrow>{eyebrow}</DetailEyebrow>
        <h2
          className={`font-display italic ${long ? "text-card-title" : "text-heard"}`}
        >
          “{entry.heard}”
        </h2>
      </header>
      {entry.followUps.map((followUp) => (
        <DetailFollowUp key={followUpKey(followUp)} followUp={followUp} />
      ))}
      <DetailOutcome entry={entry} />
      <DetailTimings timings={entry.timings} />
      {via ? (
        <section className="flex flex-col gap-1">
          <DetailEyebrow>{historyCopy.understoodBy}</DetailEyebrow>
          <span className="font-medium text-body-sm">{via.title}</span>
          <span className="text-driftwood text-ui">{via.note}</span>
        </section>
      ) : null}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => onCopy(entry)}
        >
          {historyCopy.copy}
        </Button>
        <Button
          variant="quietDestructive"
          className="flex-1"
          onClick={() => onDelete(entry)}
        >
          {historyCopy.delete}
        </Button>
      </div>
    </article>
  );
}
