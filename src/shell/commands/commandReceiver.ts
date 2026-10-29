import type { Logger } from "@getahoy/lib";
import type { Frame, SpeakTarget } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import {
  type CommandLog,
  type CommandOutcome,
  decideCommand,
  done,
  emptyCommandLog,
  failed,
  finishCommand,
  refused,
  startCommand,
} from "../../core/commands/commandLog.ts";
import type { PhoneRequest } from "../../core/connection/phoneSession.ts";
import {
  type Breaker,
  closedBreaker,
  recordCommand,
} from "../../core/safety/breaker.ts";
import type { ChoiceBook } from "./choiceBook.ts";
import { choiceTurn, commandTurn, type Turn } from "./commandTurns.ts";
import { resultFrame } from "./resultFrame.ts";

type Reply = (frame: Frame) => void;
type Queued = {
  commandId: string;
  reply: Reply;
  owner: object;
  speakOn: SpeakTarget;
  heard: string | null;
  work: () => Promise<Turn>;
};

function exitCode(error: unknown): string {
  if (error instanceof Error && "code" in error) return String(error.code);
  return "unknown";
}

const LOCKED = refused(commandCopy.unlockFirst);

type CommandReceiverOptions = {
  isLocked: () => boolean;
  run: (text: string) => Promise<CommandOutcome>;
  onHeard: (text: string) => void;
  onResult: (turn: Turn, owner: object) => void;
  onStopSpeech: (owner: object) => void;
  choices: ChoiceBook;
  logger: Logger;
};

export class CommandReceiver {
  readonly #options: CommandReceiverOptions;
  readonly #replies = new Map<string, Reply>();
  #log: CommandLog<Turn> = emptyCommandLog();
  #breaker: Breaker = closedBreaker;
  #queue: Promise<void> = Promise.resolve();

  constructor(options: CommandReceiverOptions) {
    this.#options = options;
  }

  handle(request: PhoneRequest, reply: Reply, owner: object): void {
    const { choices, run } = this.#options;
    switch (request.type) {
      case "command": {
        const { commandId, text, speakOn } = request;
        const context = { commandId, owner, speakOn, choices };
        const work = () => commandTurn(text, run, context);
        this.#enqueue({ commandId, reply, owner, speakOn, heard: text, work });
        return;
      }
      case "command.choose": {
        const { commandId, parentId, number } = request;
        const speakOn = choices.openFor(owner)?.speakOn ?? "phone";
        const context = { commandId, owner, speakOn, choices };
        const work = () => choiceTurn(parentId, number, context);
        this.#enqueue({ commandId, reply, owner, speakOn, heard: null, work });
        return;
      }
      case "choice.extend":
        choices.extend(request.choiceId, owner);
        return;
      case "speech.stop":
        this.#options.onStopSpeech(owner);
        return;
      default: {
        const unhandled: never = request;
        throw new Error(`Unhandled request ${JSON.stringify(unhandled)}`);
      }
    }
  }

  #enqueue(queued: Queued): void {
    const { commandId, reply } = queued;
    reply({ type: "command.received", commandId });
    const decision = decideCommand(this.#log, commandId);
    if (decision.kind === "repeat") {
      reply(resultFrame(commandId, decision.outcome));
      return;
    }
    this.#replies.set(commandId, reply);
    if (decision.kind === "running") return;
    this.#log = startCommand(this.#log, commandId);
    this.#queue = this.#queue
      .then(() => this.#execute(queued))
      .catch(() => this.#options.logger.warn("command", `${commandId} broke`));
  }

  async #execute(queued: Queued): Promise<void> {
    const { commandId, owner, heard } = queued;
    const { choices, onHeard, onResult, logger } = this.#options;
    if (heard) onHeard(heard);
    const paused = this.#breaker.tripped && heard !== null;
    const turn = paused
      ? this.#pausedTurn(queued)
      : await this.#turnFor(queued);
    if (!paused) this.#recordForBreaker(turn);
    const offerable = paused || !this.#breaker.tripped;
    if (turn.choice && offerable) {
      const { threadId, round, speakOn } = turn;
      const context = { threadId, round, owner, speakOn };
      choices.offer(commandId, turn.choice, context);
    }
    this.#log = finishCommand(this.#log, commandId, turn);
    logger.info("command", `${commandId} ${turn.status}`);
    this.#replies.get(commandId)?.(resultFrame(commandId, turn));
    this.#replies.delete(commandId);
    onResult(turn, owner);
  }

  async #turnFor({ commandId, speakOn, work }: Queued): Promise<Turn> {
    const { isLocked, logger } = this.#options;
    const thread = { threadId: commandId, round: 0, speakOn };
    try {
      if (isLocked()) return { ...LOCKED, ...thread };
      return await work();
    } catch (error) {
      logger.warn("command", `${commandId} failed, exit ${exitCode(error)}`);
      return { ...failed(commandCopy.failed), ...thread };
    }
  }

  #recordForBreaker(outcome: CommandOutcome): void {
    const wasTripped = this.#breaker.tripped;
    this.#breaker = recordCommand(this.#breaker, outcome.status, Date.now());
    if (!wasTripped && this.#breaker.tripped) this.#options.choices.expire();
  }

  #pausedTurn({ commandId, speakOn }: Queued): Turn {
    const resume = () => {
      this.#breaker = closedBreaker;
      return Promise.resolve(done(commandCopy.resumed));
    };
    const options = [{ number: 1, label: commandCopy.resume }];
    const choice = {
      options,
      areas: [null],
      confirm: false,
      destructive: false,
      pick: resume,
    };
    const paused = refused(commandCopy.breakerTripped);
    return { ...paused, choice, threadId: commandId, round: 0, speakOn };
  }
}
