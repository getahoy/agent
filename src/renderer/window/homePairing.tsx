import type { PairingStatus } from "../../core/pairing/pairingStatus.ts";
import { usePairingSession } from "../hooks/usePairingSession.ts";
import { PairingPanel } from "../pairing/pairingPanel.tsx";

type HomePairingProps = { status: PairingStatus };

export function HomePairing({ status }: HomePairingProps) {
  usePairingSession();
  return (
    <div className="flex flex-col items-center">
      <PairingPanel status={status} />
    </div>
  );
}
