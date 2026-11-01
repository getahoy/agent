import type { PairingStatus } from "../../core/pairing/pairingStatus.ts";
import { usePairingSession } from "../hooks/usePairingSession.ts";
import { PairingPanel } from "../pairing/pairingPanel.tsx";

type HomePairingProps = { status: PairingStatus; hasPhone: boolean };

export function HomePairing({ status, hasPhone }: HomePairingProps) {
  usePairingSession(status.kind === "idle" && !hasPhone);
  return (
    <div className="flex flex-col items-center">
      <PairingPanel status={status} />
    </div>
  );
}
