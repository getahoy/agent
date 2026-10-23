import { agentCopy } from "../../copy/agentCopy.ts";
import { ActionButton } from "./actionButton.tsx";

type PairingSucceededProps = {
  phoneName: string;
  accountEmail: string;
  finishLabel: string;
  onFinish: () => void;
};

export function PairingSucceeded({
  phoneName,
  accountEmail,
  finishLabel,
  onFinish,
}: PairingSucceededProps) {
  return (
    <div className="flex flex-col items-start gap-3" aria-live="polite">
      <p className="font-medium text-success">
        {agentCopy["pair.pairedWith"]} {phoneName}
      </p>
      <p className="text-muted text-sm">
        {agentCopy["pair.account"]}: {accountEmail}
      </p>
      <ActionButton onPress={onFinish}>{finishLabel}</ActionButton>
    </div>
  );
}
