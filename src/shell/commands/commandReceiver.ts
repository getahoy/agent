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
import type {
  IncomingChoice,
  IncomingCommand,
  PhoneRequest,
} from "../../core/connection/phoneSession.ts";
import type { ChoiceBook } from "./choiceBook.ts";

type Reply = (frame: Frame) => void;
type Work = () => Promise<CommandOutcome>;
type Queued = {
  commandId: string;
  reply: Reply;
  work: Work;
  heard: string | null;
};

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
  choices: ChoiceBook;
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

  handle(request: PhoneRequest, reply: Reply): void {
    if (request.type === "command") this.#receive(request, reply);
    else this.#choose(request, reply);
  }

  #receive({ commandId, text }: IncomingCommand, reply: Reply): void {
    const { choices, run } = this.#options;
    const work = () => {
      choices.expire();
      return run(text);
    };
    this.#enqueue({ commandId, reply, work, heard: text });
  }

  #choose({ commandId, parentId, number }: IncomingChoice, reply: Reply) {
    const work = () => this.#options.choices.pick(parentId, number);
    this.#enqueue({ commandId, reply, work, heard: null });
  }

  #enqueue({ commandId, reply, work, heard }: Queued): void {
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
      .then(() => this.#execute(commandId, work, heard))
      .catch(() => this.#options.logger.warn("command", `${commandId} broke`));
  }

  async #execute(commandId: string, work: Work, heard: string | null) {
    if (heard) this.#options.onHeard(heard);
    const outcome = await this.#outcomeFor(commandId, work);
    if (outcome.choice) this.#options.choices.offer(commandId, outcome.choice);
    this.#log = finishCommand(this.#log, commandId, outcome);
    this.#options.logger.info("command", `${commandId} ${outcome.status}`);
    this.#replies.get(commandId)?.(this.#resultFrame(commandId, outcome));
    this.#replies.delete(commandId);
  }

  async #outcomeFor(commandId: string, work: Work): Promise<CommandOutcome> {
    const { isLocked, logger } = this.#options;
    try {
      if (isLocked()) return LOCKED;
      return await work();
    } catch (error) {
      logger.warn("command", `${commandId} failed, exit ${exitCode(error)}`);
      return { status: "failed", message: commandCopy.failed };
    }
  }

  #resultFrame(commandId: string, outcome: CommandOutcome): Frame {
    const { status, choice } = outcome;
    const message = outcome.message.slice(0, MAX_RESULT_MESSAGE_CHARS);
    const choices = choice ? [...choice.options] : [];
    const confirm = choice?.confirm ?? false;
    return {
      type: "command.result",
      commandId,
      status,
      message,
      choices,
      confirm,
    };
  }
}
