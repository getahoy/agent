import type { CommandStatus } from "@getahoy/protocol";

export const MAX_ACTIONS_PER_MINUTE = 30;
export const MAX_FAILURES_IN_ROW = 5;
const MINUTE_MS = 60_000;

export type Breaker = {
  actionTimes: readonly number[];
  failuresInRow: number;
  tripped: boolean;
};

export const closedBreaker: Breaker = {
  actionTimes: [],
  failuresInRow: 0,
  tripped: false,
};

export function recordCommand(
  breaker: Breaker,
  status: CommandStatus,
  now: number,
): Breaker {
  const recent = breaker.actionTimes.filter((at) => now - at < MINUTE_MS);
  const actionTimes = [...recent, now];
  const failuresInRow = status === "failed" ? breaker.failuresInRow + 1 : 0;
  const tripped =
    breaker.tripped ||
    actionTimes.length > MAX_ACTIONS_PER_MINUTE ||
    failuresInRow >= MAX_FAILURES_IN_ROW;
  return { actionTimes, failuresInRow, tripped };
}
