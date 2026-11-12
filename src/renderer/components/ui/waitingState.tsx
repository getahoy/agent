import { useElapsedOver, useSpinnerVisible } from "@getahoy/lib";
import { PennantSpinner } from "./pennantSpinner.tsx";

const SLOW_AFTER_MS = 6000;

type WaitingStateProps = {
  busy: boolean;
  message: string;
  slowMessage?: string;
  slowHint?: string;
  slowAfterMs?: number;
};

export function WaitingState({
  busy,
  message,
  slowMessage,
  slowHint,
  slowAfterMs = SLOW_AFTER_MS,
}: WaitingStateProps) {
  const visible = useSpinnerVisible(busy);
  const slow = useElapsedOver(busy, slowAfterMs) ? slowMessage : undefined;
  if (!visible) return null;
  const line = slow ?? message;
  return (
    <div
      role="progressbar"
      aria-label={line}
      aria-live="polite"
      className="flex flex-1 animate-qr-fade flex-col items-center justify-center gap-4 px-8 pb-15 text-center"
    >
      <PennantSpinner />
      <span className="flex max-w-65 flex-col gap-1.5">
        <span className="text-driftwood text-row">{line}</span>
        {slow && slowHint ? (
          <span className="animate-qr-fade text-driftwood text-ui">
            {slowHint}
          </span>
        ) : null}
      </span>
    </div>
  );
}
