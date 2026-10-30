import type { PhoneSummary } from "../../core/appState/appState.ts";
import { Card } from "../components/ui/card.tsx";
import { StatusPill } from "../components/ui/statusPill.tsx";
import { PhoneGlyph } from "../phone/phoneGlyph.tsx";
import type { PhoneLinkKind } from "../phone/phoneLink.ts";
import { homeLine, pillLabels } from "../phone/phoneLinkCopy.ts";

type PhoneStatusCardProps = { kind: PhoneLinkKind; phone: PhoneSummary };

export function PhoneStatusCard({ kind, phone }: PhoneStatusCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <PhoneGlyph />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-medium text-row">{phone.displayName}</span>
          <span className="text-driftwood text-ui" aria-live="polite">
            {homeLine(kind, phone.displayName)}
          </span>
        </div>
        <StatusPill
          label={pillLabels[kind]}
          tone={kind === "connected" ? "live" : "quiet"}
        />
      </div>
    </Card>
  );
}
