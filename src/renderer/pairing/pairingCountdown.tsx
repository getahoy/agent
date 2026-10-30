import { agentCopy } from "../../copy/agentCopy.ts";
import { useNow } from "../hooks/useNow.ts";

const SECOND_MS = 1000;
const SECONDS_PER_MINUTE = 60;

function clock(msLeft: number): string {
  const seconds = Math.max(0, Math.ceil(msLeft / SECOND_MS));
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = String(seconds % SECONDS_PER_MINUTE).padStart(2, "0");
  return `${minutes}:${rest}`;
}

type PairingCountdownProps = { expiresAt: number };

export function PairingCountdown({ expiresAt }: PairingCountdownProps) {
  const now = useNow(SECOND_MS);
  return (
    <p className="flex items-center gap-2 text-driftwood text-ui">
      {agentCopy["pair.refresh"]}
      <span aria-hidden="true">·</span>
      <time className="font-medium font-mono text-caption text-ink tabular-nums">
        {clock(expiresAt - now)}
      </time>
    </p>
  );
}
