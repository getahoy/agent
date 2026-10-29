export const MAX_FOLLOW_UPS = 3;

export type ThreadEnd =
  | "done"
  | "cancelled"
  | "expired"
  | "replaced"
  | "screenChanged";

// A thread grows only when Ahoy asked something back, never by time.
export function nextRound(round: number): number | null {
  const next = round + 1;
  return next > MAX_FOLLOW_UPS ? null : next;
}

// Picking for the user is fine for a harmless click, never for a destructive one.
export function mayDelegate(destructive: boolean): boolean {
  return !destructive;
}
