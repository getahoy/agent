import { CHOICE_TTL_MS, type SpeakTarget } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import {
  type Choice,
  type CommandOutcome,
  failed,
  spoken,
} from "../../core/commands/commandLog.ts";

// Holding the talk button to answer buys this much more time, at most twice per choice.
const EXTEND_MS = 30_000;
const MAX_EXTENSIONS = 2;

export type ChoiceContext = {
  threadId: string;
  round: number;
  owner: object;
  speakOn: SpeakTarget;
};

export type OpenChoice = ChoiceContext & { parentId: string; choice: Choice };

type Pending = OpenChoice & {
  timer: ReturnType<typeof setTimeout>;
  extensions: number;
};

type ChoiceBookOptions = { clearOverlay: () => void };

const CHANGED = spoken(failed(commandCopy.screenChanged), {
  kind: "screenChanged",
});

export class ChoiceBook {
  readonly #options: ChoiceBookOptions;
  #pending: Pending | null = null;

  constructor(options: ChoiceBookOptions) {
    this.#options = options;
  }

  offer(parentId: string, choice: Choice, context: ChoiceContext): void {
    this.expire();
    const timer = this.#expireAfter(CHOICE_TTL_MS);
    this.#pending = { ...context, parentId, choice, timer, extensions: 0 };
  }

  openFor(owner: object): OpenChoice | null {
    const pending = this.#pending;
    return pending && pending.owner === owner ? pending : null;
  }

  answered(round: number): void {
    if (this.#pending) this.#pending.round = round;
  }

  pick(parentId: string, number: number, owner: object) {
    const pending = this.#pending;
    if (pending?.parentId !== parentId || pending.owner !== owner) {
      return Promise.resolve<CommandOutcome>(CHANGED);
    }
    this.expire();
    const known = pending.choice.options.some(
      (option) => option.number === number,
    );
    return known ? pending.choice.pick(number) : Promise.resolve(CHANGED);
  }

  extend(choiceId: string, owner: object): void {
    const pending = this.#pending;
    if (pending?.parentId !== choiceId || pending.owner !== owner) return;
    if (pending.extensions >= MAX_EXTENSIONS) return;
    clearTimeout(pending.timer);
    pending.timer = this.#expireAfter(EXTEND_MS);
    pending.extensions += 1;
  }

  expire(): void {
    if (!this.#pending) return;
    clearTimeout(this.#pending.timer);
    this.#pending = null;
    this.#options.clearOverlay();
  }

  #expireAfter(ms: number): ReturnType<typeof setTimeout> {
    return setTimeout(() => this.expire(), ms);
  }
}
