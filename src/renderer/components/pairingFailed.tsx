import { agentCopy } from "../../copy/agentCopy.ts";
import { ActionButton } from "./actionButton.tsx";

type PairingFailedProps = {
  message: string;
  onRetry: () => void;
};

export function PairingFailed({ message, onRetry }: PairingFailedProps) {
  return (
    <div className="flex flex-col items-start gap-4" role="alert">
      <p className="text-destructive text-sm">{message}</p>
      <ActionButton onPress={onRetry}>{agentCopy["pair.retry"]}</ActionButton>
    </div>
  );
}
