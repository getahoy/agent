import { pairingCodeCopy } from "../../copy/pairingCodeCopy.ts";
import { useNow } from "../hooks/useNow.ts";
import { cn } from "../lib/cn.ts";

const SECOND_MS = 1000;
const SECONDS_PER_MINUTE = 60;

function clock(msLeft: number): string {
  const seconds = Math.max(0, Math.ceil(msLeft / SECOND_MS));
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = String(seconds % SECONDS_PER_MINUTE).padStart(2, "0");
  return `${minutes}:${rest}`;
}

type CodeTimerProps = { expiresAt: number | null };

export function CodeTimer({ expiresAt }: CodeTimerProps) {
  const now = useNow(SECOND_MS);
  const msLeft = expiresAt === null ? 0 : expiresAt * SECOND_MS - now;
  return (
    <p
      aria-hidden="true"
      className={cn(
        "whitespace-nowrap font-medium font-mono text-caption text-ink tabular-nums leading-4.5",
        expiresAt === null && "invisible",
      )}
    >
      {pairingCodeCopy.newCodeIn(clock(msLeft))}
    </p>
  );
}
