import type {
  CommandChoice,
  CommandStatus,
  FailureReason,
  UnderstoodBy,
} from "@getahoy/protocol";
import type { Area } from "../resolver/elementArea.ts";
import type { SpeechCase } from "../voice/buildSpeech.ts";

export const REMEMBERED_COMMANDS = 100;

export type Choice = {
  options: readonly CommandChoice[];
  areas: readonly (Area | null)[];
  confirm: boolean;
  destructive: boolean;
  pick: (number: number) => Promise<CommandOutcome>;
};

export type CommandOutcome = {
  status: CommandStatus;
  message: string;
  choice?: Choice;
  speech?: SpeechCase;
  reason?: OutcomeReason;
  app?: string;
  via?: UnderstoodBy;
};

export function spoken(outcome: CommandOutcome, speech: SpeechCase) {
  return { ...outcome, speech };
}

// Reasons the Mac tells apart before they reach the wire's closed set.
export type OutcomeReason = FailureReason | "choiceExpired";

export function because(
  outcome: CommandOutcome,
  reason: OutcomeReason,
): CommandOutcome {
  return { ...outcome, reason };
}

export const done = (message: string): CommandOutcome => ({
  status: "done",
  message,
});
export const failed = (message: string): CommandOutcome => ({
  status: "failed",
  message,
});
export const refused = (message: string): CommandOutcome => ({
  status: "refused",
  message,
});

export type CommandLog<Outcome = CommandOutcome> = {
  done: ReadonlyMap<string, Outcome>;
  running: ReadonlySet<string>;
};

export type CommandDecision<Outcome = CommandOutcome> =
  | { kind: "run" }
  | { kind: "running" }
  | { kind: "repeat"; outcome: Outcome };

export function emptyCommandLog<Outcome>(): CommandLog<Outcome> {
  return { done: new Map(), running: new Set() };
}

export function decideCommand<Outcome>(
  log: CommandLog<Outcome>,
  commandId: string,
): CommandDecision<Outcome> {
  const outcome = log.done.get(commandId);
  if (outcome) return { kind: "repeat", outcome };
  if (log.running.has(commandId)) return { kind: "running" };
  return { kind: "run" };
}

export function startCommand<Outcome>(
  log: CommandLog<Outcome>,
  commandId: string,
): CommandLog<Outcome> {
  return { ...log, running: new Set(log.running).add(commandId) };
}

export function finishCommand<Outcome>(
  log: CommandLog<Outcome>,
  commandId: string,
  outcome: Outcome,
): CommandLog<Outcome> {
  const running = new Set(log.running);
  running.delete(commandId);
  const done = new Map(log.done).set(commandId, outcome);
  for (const oldest of done.keys()) {
    if (done.size <= REMEMBERED_COMMANDS) break;
    done.delete(oldest);
  }
  return { done, running };
}
