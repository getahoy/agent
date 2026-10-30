import { agentCopy, pairingFailureCopy } from "../../copy/agentCopy.ts";
import type { PairingStatus } from "../../core/pairing/pairingStatus.ts";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePendingAction } from "../hooks/usePendingAction.ts";
import { PairingDone } from "./pairingDone.tsx";
import { PairingFailed } from "./pairingFailed.tsx";
import { PairingOffer } from "./pairingOffer.tsx";

type PairingPanelProps = { status: PairingStatus };

export function PairingPanel({ status }: PairingPanelProps) {
  const actions = useAgentActions();
  const [finish, finishing] = usePendingAction(actions.finishPairing);
  switch (status.kind) {
    case "idle":
    case "starting":
      return (
        <p aria-busy="true" className="py-24 text-driftwood text-ui">
          {agentCopy["pair.starting"]}
        </p>
      );
    case "offering":
      return <PairingOffer {...status} />;
    case "failed":
      return (
        <PairingFailed
          message={pairingFailureCopy[status.reason]}
          onRetry={() => void actions.startPairing()}
        />
      );
    case "paired":
      return (
        <PairingDone
          phoneName={status.phoneName}
          accountEmail={status.accountEmail}
          pending={finishing}
          onFinish={finish}
        />
      );
    default: {
      const unhandled: never = status;
      return unhandled;
    }
  }
}
