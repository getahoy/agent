import { useState } from "react";
import { agentCopy } from "../../copy/agentCopy.ts";
import { homeCopy } from "../../copy/homeCopy.ts";
import type { PhoneSummary } from "../../core/appState/appState.ts";
import { Button } from "../components/ui/button.tsx";
import { ConfirmDialog } from "../components/ui/confirmDialog.tsx";
import { ListRow } from "../components/ui/listRow.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { useNow } from "../hooks/useNow.ts";
import { usePendingAction } from "../hooks/usePendingAction.ts";
import { PhoneGlyph } from "../phone/phoneGlyph.tsx";
import { relativeTime } from "../phone/relativeTime.ts";

const CLOCK_TICK_MS = 30_000;
const pairedDate = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});

type PairedPhoneRowProps = {
  phone: PhoneSummary;
  connected: boolean;
  lastConnectedAt: number | null;
};

function phoneDetail(phone: PhoneSummary, since: string | null): string {
  const paired = homeCopy.pairedOn(pairedDate.format(phone.pairedAt));
  return since ? homeCopy.phoneWithStatus(paired, since) : paired;
}

export function PairedPhoneRow({
  phone,
  connected,
  lastConnectedAt,
}: PairedPhoneRowProps) {
  const actions = useAgentActions();
  const now = useNow(CLOCK_TICK_MS);
  const [confirming, setConfirming] = useState(false);
  const [remove, removing] = usePendingAction(() =>
    actions.unpairPhone(phone.publicKey),
  );
  const since =
    connected || lastConnectedAt === null
      ? null
      : `${homeCopy.lastConnected} ${relativeTime(lastConnectedAt, now)}`;
  return (
    <>
      <ListRow
        leading={<PhoneGlyph />}
        title={phone.displayName}
        detail={phoneDetail(phone, since)}
        trailing={
          <Button
            variant="quietDestructive"
            size="sm"
            onClick={() => setConfirming(true)}
          >
            {agentCopy["remove.confirm"]}
          </Button>
        }
      />
      <ConfirmDialog
        open={confirming}
        title={homeCopy.removeTitle(phone.displayName)}
        body={agentCopy["remove.body"]}
        confirmLabel={agentCopy["remove.confirm"]}
        cancelLabel={agentCopy["dialog.cancel"]}
        pending={removing}
        onConfirm={() => remove()}
        onOpenChange={setConfirming}
      />
    </>
  );
}
