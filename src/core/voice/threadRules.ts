export const MAX_FOLLOW_UPS = 3;

// A thread grows only when Ahoy asked something back, never by time.
export function nextRound(round: number): number | null {
  const next = round + 1;
  return next > MAX_FOLLOW_UPS ? null : next;
}
