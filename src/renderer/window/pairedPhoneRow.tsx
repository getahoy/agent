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

type PairedPhoneRowProps = {
  phone: PhoneSummary;
  connected: boolean;
  lastConnectedAt: number | null;
};

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
        detail={
          since
            ? homeCopy.phoneWithStatus(phone.accountEmail, since)
            : phone.accountEmail
        }
        trailing={
          <Button
            variant="quietDestructive"
            size="sm"
            onClick={() => setConfirming(true)}
          >
            {homeCopy.remove}
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
