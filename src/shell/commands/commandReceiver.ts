import type { Logger } from "@getahoy/lib";
import { type Frame, MAX_RESULT_MESSAGE_CHARS } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import {
  type CommandLog,
  type CommandOutcome,
  decideCommand,
  emptyCommandLog,
  finishCommand,
  startCommand,
} from "../../core/commands/commandLog.ts";
import type { IncomingCommand } from "../../core/connection/phoneSession.ts";

type Reply = (frame: Frame) => void;

function exitCode(error: unknown): string {
  if (error instanceof Error && "code" in error) return String(error.code);
  return "unknown";
}

const LOCKED: CommandOutcome = {
  status: "refused",
  message: commandCopy.unlockFirst,
};

type CommandReceiverOptions = {
  isLocked: () => boolean;
  run: (text: string) => Promise<CommandOutcome>;
  onHeard: (text: string) => void;
  logger: Logger;
};

export class CommandReceiver {
  readonly #options: CommandReceiverOptions;
  readonly #replies = new Map<string, Reply>();
  #log: CommandLog = emptyCommandLog;
  #queue: Promise<void> = Promise.resolve();

  constructor(options: CommandReceiverOptions) {
    this.#options = options;
  }

  receive(command: IncomingCommand, reply: Reply): void {
    const { commandId } = command;
    reply({ type: "command.received", commandId });
    const decision = decideCommand(this.#log, commandId);
    if (decision.kind === "repeat") {
      reply(this.#resultFrame(commandId, decision.outcome));
      return;
    }
    this.#replies.set(commandId, reply);
    if (decision.kind === "running") return;
    this.#log = startCommand(this.#log, commandId);
    this.#queue = this.#queue
      .then(() => this.#execute(command))
      .catch(() => this.#options.logger.warn("command", `${commandId} broke`));
  }

  async #execute({ commandId, text }: IncomingCommand): Promise<void> {
    const outcome = await this.#outcomeFor(commandId, text);
    this.#log = finishCommand(this.#log, commandId, outcome);
    this.#options.logger.info("command", `${commandId} ${outcome.status}`);
    this.#replies.get(commandId)?.(this.#resultFrame(commandId, outcome));
    this.#replies.delete(commandId);
  }

  async #outcomeFor(commandId: string, text: string): Promise<CommandOutcome> {
    const { isLocked, onHeard, run, logger } = this.#options;
    try {
      onHeard(text);
      if (isLocked()) return LOCKED;
      return await run(text);
    } catch (error) {
      logger.warn("command", `${commandId} failed, exit ${exitCode(error)}`);
      return { status: "failed", message: commandCopy.failed };
    }
  }

  #resultFrame(commandId: string, outcome: CommandOutcome): Frame {
    const { status } = outcome;
    const message = outcome.message.slice(0, MAX_RESULT_MESSAGE_CHARS);
    return { type: "command.result", commandId, status, message };
  }
}
