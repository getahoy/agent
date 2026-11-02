import type { PairingStatus } from "../../core/pairing/pairingStatus.ts";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePendingAction } from "../hooks/usePendingAction.ts";
import { PairingCode, type PairingPlace } from "./pairingCode.tsx";
import { PairingDone } from "./pairingDone.tsx";

type PairingPanelProps = { status: PairingStatus; place: PairingPlace };

export function PairingPanel({ status, place }: PairingPanelProps) {
  const actions = useAgentActions();
  const [finish, finishing] = usePendingAction(actions.finishPairing);
  if (status.kind !== "paired") {
    return <PairingCode status={status} place={place} />;
  }
  return (
    <PairingDone
      phoneName={status.phoneName}
      accountEmail={status.accountEmail}
      pending={finishing}
      onFinish={finish}
    />
  );
}
