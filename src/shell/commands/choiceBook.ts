import { CHOICE_TTL_MS } from "@getahoy/protocol";
import { commandCopy } from "../../copy/commandCopy.ts";
import {
  type Choice,
  type CommandOutcome,
  failed,
} from "../../core/commands/commandLog.ts";

type Pending = {
  parentId: string;
  choice: Choice;
  timer: ReturnType<typeof setTimeout>;
};

type ChoiceBookOptions = { clearOverlay: () => void };

const CHANGED = failed(commandCopy.screenChanged);

export class ChoiceBook {
  readonly #options: ChoiceBookOptions;
  #pending: Pending | null = null;

  constructor(options: ChoiceBookOptions) {
    this.#options = options;
  }

  offer(parentId: string, choice: Choice): void {
    this.expire();
    const timer = setTimeout(() => this.expire(), CHOICE_TTL_MS);
    this.#pending = { parentId, choice, timer };
  }

  pick(parentId: string, number: number): Promise<CommandOutcome> {
    const pending = this.#pending;
    if (!pending || pending.parentId !== parentId) {
      return Promise.resolve(CHANGED);
    }
    this.expire();
    const known = pending.choice.options.some(
      (option) => option.number === number,
    );
    return known ? pending.choice.pick(number) : Promise.resolve(CHANGED);
  }

  expire(): void {
    if (!this.#pending) return;
    clearTimeout(this.#pending.timer);
    this.#pending = null;
    this.#options.clearOverlay();
  }
}
