import type { AgentState, PhoneSummary } from "../../core/appState/appState.ts";
import { Card } from "../components/ui/card.tsx";
import { StatusPill } from "../components/ui/statusPill.tsx";
import { cn } from "../lib/cn.ts";
import { LastHeard } from "../phone/lastHeard.tsx";
import { PhoneGlyph } from "../phone/phoneGlyph.tsx";
import type { PhoneLinkKind } from "../phone/phoneLink.ts";
import { pillLabels, popoverLine } from "../phone/phoneLinkCopy.ts";

type PopoverPhoneCardProps = {
  kind: PhoneLinkKind;
  phone: PhoneSummary;
  lastHeard: AgentState["lastHeard"];
};

export function PopoverPhoneCard({
  kind,
  phone,
  lastHeard,
}: PopoverPhoneCardProps) {
  const quiet = kind === "off" || kind === "locked";
  return (
    <Card surface="glass" className={cn(kind === "off" && "opacity-55")}>
      <div className="flex items-center gap-2.5">
        <PhoneGlyph size="sm" />
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="font-medium text-ui">{phone.displayName}</span>
          <span className="truncate text-caption text-driftwood">
            {popoverLine(kind, phone.displayName)}
          </span>
        </div>
        <StatusPill
          size="sm"
          label={pillLabels[kind]}
          tone={kind === "connected" ? "live" : "quiet"}
        />
      </div>
      {lastHeard && !quiet ? (
        <div className="border-hairline border-t pt-2.5">
          <LastHeard heard={lastHeard} size="popover" />
        </div>
      ) : null}
    </Card>
  );
}
