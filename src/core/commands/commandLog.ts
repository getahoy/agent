import type { CommandChoice, CommandStatus } from "@getahoy/protocol";

export const REMEMBERED_COMMANDS = 100;

export type Choice = {
  options: readonly CommandChoice[];
  confirm: boolean;
  pick: (number: number) => Promise<CommandOutcome>;
};

export type CommandOutcome = {
  status: CommandStatus;
  message: string;
  choice?: Choice;
};

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

export type CommandLog = {
  done: ReadonlyMap<string, CommandOutcome>;
  running: ReadonlySet<string>;
};

export type CommandDecision =
  | { kind: "run" }
  | { kind: "running" }
  | { kind: "repeat"; outcome: CommandOutcome };

export const emptyCommandLog: CommandLog = {
  done: new Map(),
  running: new Set(),
};

export function decideCommand(
  log: CommandLog,
  commandId: string,
): CommandDecision {
  const outcome = log.done.get(commandId);
  if (outcome) return { kind: "repeat", outcome };
  if (log.running.has(commandId)) return { kind: "running" };
  return { kind: "run" };
}

export function startCommand(log: CommandLog, commandId: string): CommandLog {
  return { ...log, running: new Set(log.running).add(commandId) };
}

export function finishCommand(
  log: CommandLog,
  commandId: string,
  outcome: CommandOutcome,
): CommandLog {
  const running = new Set(log.running);
  running.delete(commandId);
  const done = new Map(log.done).set(commandId, outcome);
  for (const oldest of done.keys()) {
    if (done.size <= REMEMBERED_COMMANDS) break;
    done.delete(oldest);
  }
  return { done, running };
}
