import { agentCopy, pairingFailureCopy } from "../../copy/agentCopy.ts";
import type { PairingStatus } from "../../core/pairing/pairingStatus.ts";
import { PairingFailed } from "./pairingFailed.tsx";
import { PairingQrCode } from "./pairingQrCode.tsx";
import { PairingSucceeded } from "./pairingSucceeded.tsx";

type PairingPanelProps = {
  status: PairingStatus;
  onFinish: () => void;
  onRetry: () => void;
};

export function PairingPanel({ status, onFinish, onRetry }: PairingPanelProps) {
  switch (status.kind) {
    case "idle":
    case "starting":
      return (
        <p className="text-muted text-sm" aria-busy="true">
          {agentCopy["pair.starting"]}
        </p>
      );
    case "offering":
      return (
        <PairingQrCode qr={status.qr} reachableOnLan={status.reachableOnLan} />
      );
    case "failed":
      return (
        <PairingFailed
          message={pairingFailureCopy[status.reason]}
          onRetry={onRetry}
        />
      );
    case "paired":
      return (
        <PairingSucceeded
          phoneName={status.phoneName}
          accountEmail={status.accountEmail}
          finishLabel={agentCopy["pair.done"]}
          onFinish={onFinish}
        />
      );
    default: {
      const unhandled: never = status;
      return unhandled;
    }
  }
}
