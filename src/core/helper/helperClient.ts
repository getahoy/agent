import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import {
  type HelperArgs,
  type HelperErrorCode,
  type HelperEvent,
  type HelperLine,
  type HelperOutcome,
  type HelperVerb,
  helperLineSchema,
  outputParsers,
} from "./helperProtocol.ts";

type HelperProcess = {
  stdin: Writable;
  stdout: Readable;
  kill: () => boolean;
  once: (event: "exit" | "error", listener: () => void) => unknown;
};

type HelperClientOptions = {
  spawnHelper: () => HelperProcess;
  requestTimeoutMs: number;
  restartDelaysMs: readonly number[];
  onEvent: (event: HelperEvent) => void;
};

type RawOutcome =
  | { ok: true; output: unknown }
  | { ok: false; error: { code: HelperErrorCode; message: string } };

type PendingRequest = {
  finish: (outcome: RawOutcome) => void;
  timer: NodeJS.Timeout;
};

export class HelperClient {
  readonly #options: HelperClientOptions;
  readonly #pending = new Map<string, PendingRequest>();
  #process: HelperProcess | null = null;
  #nextId = 1;
  #restartAttempt = 0;
  #stopped = true;

  constructor(options: HelperClientOptions) {
    this.#options = options;
  }

  start(): void {
    this.#stopped = false;
    this.#launch();
  }

  stop(): void {
    this.#stopped = true;
    const running = this.#process;
    this.#process = null;
    this.#failPending();
    running?.kill();
  }

  request<Verb extends HelperVerb>(
    verb: Verb,
    args: HelperArgs[Verb],
  ): Promise<HelperOutcome<Verb>> {
    const running = this.#process;
    if (!running) {
      return Promise.resolve(
        failure("helper_unavailable", "The helper is not running"),
      );
    }
    const id = String(this.#nextId++);
    return new Promise((resolve) => {
      const timer = setTimeout(
        () => this.#settle(id, failure("timeout", `${verb} took too long`)),
        this.#options.requestTimeoutMs,
      );
      const finish = (outcome: RawOutcome) => resolve(typed(verb, outcome));
      this.#pending.set(id, { finish, timer });
      running.stdin.write(`${JSON.stringify({ id, verb, args })}\n`);
    });
  }

  #launch(): void {
    const launched = this.#options.spawnHelper();
    this.#process = launched;
    createInterface({ input: launched.stdout }).on("line", (text) =>
      this.#receive(text),
    );
    const handleGone = () => this.#handleExit(launched);
    launched.once("exit", handleGone);
    launched.once("error", handleGone);
    launched.stdin.on("error", handleGone);
  }

  #receive(text: string): void {
    const line = parseLine(text);
    if (!line) return;
    if ("event" in line) {
      if (line.event === "ready") this.#restartAttempt = 0;
      this.#options.onEvent(line.event);
      return;
    }
    if (line.id === undefined) return;
    this.#settle(
      line.id,
      line.ok
        ? { ok: true, output: line.output }
        : { ok: false, error: line.error },
    );
  }

  #settle(id: string, outcome: RawOutcome): void {
    const pending = this.#pending.get(id);
    if (!pending) return;
    this.#pending.delete(id);
    clearTimeout(pending.timer);
    pending.finish(outcome);
  }

  #failPending(): void {
    for (const id of [...this.#pending.keys()]) {
      this.#settle(id, failure("helper_exited", "The helper stopped"));
    }
  }

  #handleExit(exited: HelperProcess): void {
    if (this.#process !== exited) return;
    this.#process = null;
    this.#failPending();
    this.#options.onEvent("exited");
    if (this.#stopped) return;
    const delays = this.#options.restartDelaysMs;
    const delay =
      delays[Math.min(this.#restartAttempt, delays.length - 1)] ?? 0;
    this.#restartAttempt += 1;
    setTimeout(() => {
      if (!this.#stopped) this.#launch();
    }, delay);
  }
}

function parseLine(text: string): HelperLine | null {
  try {
    const parsed = helperLineSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function typed<Verb extends HelperVerb>(
  verb: Verb,
  outcome: RawOutcome,
): HelperOutcome<Verb> {
  if (!outcome.ok) return outcome;
  const output = outputParsers[verb](outcome.output);
  if (output !== null) return { ok: true, output };
  return failure(
    "invalid_output",
    `The helper sent an unexpected ${verb} reply`,
  );
}

function failure(
  code: HelperErrorCode,
  message: string,
): { ok: false; error: { code: HelperErrorCode; message: string } } {
  return { ok: false, error: { code, message } };
}
