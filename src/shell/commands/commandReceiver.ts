import type { Logger } from "@getahoy/lib";
import type { Frame, SpeakTarget } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import {
  type CommandDecision,
  type CommandLog,
  type CommandOutcome,
  decideCommand,
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
import { pausedTurn } from "./pausedTurn.ts";
import { resultFrame } from "./resultFrame.ts";

type Reply = (frame: Frame) => void;
type Queued = {
  commandId: string;
  reply: Reply;
  owner: object;
  speakOn: SpeakTarget;
  heard: string | null;
  work: () => Promise<Turn>;
  cancel: AbortController;
};

function exitCode(error: unknown): string {
  if (error instanceof Error && "code" in error) return String(error.code);
  return "unknown";
}

const LOCKED = refused(commandCopy.unlockFirst);

type CommandReceiverOptions = {
  isLocked: () => boolean;
  run: (text: string, cancel: AbortSignal) => Promise<CommandOutcome>;
  onHeard: (text: string) => void;
  onResult: (turn: Turn, owner: object, heard: string | null) => void;
  onStopSpeech: (owner: object) => void;
  choices: ChoiceBook;
  logger: Logger;
};

export class CommandReceiver {
  readonly #options: CommandReceiverOptions;
  readonly #replies = new Map<string, Reply>();
  readonly #cancels = new Map<string, AbortController>();
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
        this.#options.onStopSpeech(owner);
        const { commandId, text, speakOn } = request;
        const cancel = new AbortController();
        const context = { commandId, owner, speakOn, choices };
        const runCancelable = (said: string) => run(said, cancel.signal);
        const work = () => commandTurn(text, runCancelable, context);
        const queued = { commandId, reply, owner, speakOn, work, cancel };
        this.#enqueue({ ...queued, heard: text });
        return;
      }
      case "command.choose": {
        const { commandId, parentId, number } = request;
        const speakOn = choices.openFor(owner)?.speakOn ?? "phone";
        const cancel = new AbortController();
        const context = { commandId, owner, speakOn, choices };
        const work = () => choiceTurn(parentId, number, context);
        const queued = { commandId, reply, owner, speakOn, work, cancel };
        this.#enqueue({ ...queued, heard: null });
        return;
      }
      case "command.cancel":
        this.#cancels.get(request.commandId)?.abort();
        return;
      case "command.lookup":
        this.#lookUp(request.commandId, reply);
        return;
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

  #lookUp(commandId: string, reply: Reply): void {
    if (decideCommand(this.#log, commandId).kind === "run") {
      reply({ type: "command.unknown", commandId });
      return;
    }
    this.#follow(commandId, reply);
  }

  #follow(commandId: string, reply: Reply): CommandDecision<Turn>["kind"] {
    reply({ type: "command.received", commandId });
    const decision = decideCommand(this.#log, commandId);
    if (decision.kind === "repeat") {
      reply(resultFrame(commandId, decision.outcome));
      return decision.kind;
    }
    this.#replies.set(commandId, reply);
    return decision.kind;
  }

  #enqueue(queued: Queued): void {
    const { commandId, reply } = queued;
    if (this.#follow(commandId, reply) !== "run") return;
    this.#cancels.set(commandId, queued.cancel);
    this.#log = startCommand(this.#log, commandId);
    const receivedAt = performance.now();
    this.#queue = this.#queue
      .then(() => this.#execute(queued, receivedAt))
      .catch(() => this.#options.logger.warn("command", `${commandId} broke`));
  }

  async #execute(queued: Queued, receivedAt: number): Promise<void> {
    const { commandId, owner, heard, cancel } = queued;
    const { choices, onHeard, onResult, logger } = this.#options;
    if (cancel.signal.aborted) return this.#dropCancelled(queued);
    if (heard) onHeard(heard);
    const paused = this.#breaker.tripped && heard !== null;
    const ran = paused ? this.#pausedTurn(queued) : await this.#turnFor(queued);
    if (cancel.signal.aborted) return this.#dropCancelled(queued);
    this.#cancels.delete(commandId);
    const onMacMs = Math.round(performance.now() - receivedAt);
    const turn = { ...ran, onMacMs };
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
    onResult(turn, owner, heard);
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
    return pausedTurn(commandId, speakOn, () => {
      this.#breaker = closedBreaker;
    });
  }

  // The phone has moved on: nothing is said, offered or recorded for this command.
  #dropCancelled({ commandId, speakOn }: Queued): void {
    const thread = { threadId: commandId, round: 0, speakOn };
    const turn = { ...failed(commandCopy.cancelled), ...thread };
    this.#log = finishCommand(this.#log, commandId, turn);
    this.#replies.delete(commandId);
    this.#cancels.delete(commandId);
    this.#options.logger.info("command", `${commandId} cancelled`);
  }
}
