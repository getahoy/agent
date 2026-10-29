import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { Logger } from "@getahoy/lib";
import type { Turn } from "../commands/commandTurns.ts";
import { speechOf } from "../commands/resultFrame.ts";
import type { IdentityStore } from "../identity/identityStore.ts";

const run = promisify(execFile);
const PREFERRED_SAY_VOICE = "Samantha";
const SPEAK_TIMEOUT_MS = 5000;

type MacVoiceOptions = {
  apiUrl: string;
  identity: IdentityStore;
  isLocked: () => boolean;
  logger: Logger;
};

type Utterance = { owner: object; abort: AbortController };

export class MacVoice {
  readonly #options: MacVoiceOptions;
  #current: Utterance | null = null;
  #sayVoice: Promise<string[]> | null = null;

  constructor(options: MacVoiceOptions) {
    this.#options = options;
  }

  speakTurn(turn: Turn, owner: object): void {
    const speech = speechOf(turn);
    const onMac = turn.speakOn === "mac" || turn.speakOn === "both";
    if (speech && onMac) void this.speak(speech, owner);
  }

  async speak(text: string, owner: object): Promise<void> {
    if (this.#options.isLocked()) return;
    this.stop();
    const utterance = { owner, abort: new AbortController() };
    this.#current = utterance;
    const { signal } = utterance.abort;
    const file = await this.#fetchSpeech(text, signal);
    const played = file ? await this.#play(file, signal) : false;
    // A killed afplay means stop was asked for, so say must not start for this utterance.
    if (played || signal.aborted) return;
    await this.#say(text, signal);
  }

  stop(owner?: object): void {
    const current = this.#current;
    if (!current || (owner && current.owner !== owner)) return;
    current.abort.abort();
    this.#current = null;
  }

  async #fetchSpeech(text: string, signal: AbortSignal) {
    const token = this.#options.identity.sessionToken();
    if (!token) return null;
    const url = new URL("/api/speak", this.#options.apiUrl);
    const timeout = AbortSignal.timeout(SPEAK_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ text, voice: "default" }),
        signal: AbortSignal.any([signal, timeout]),
      });
      if (!response.ok) return this.#fellBack(`http ${response.status}`);
      const file = path.join(tmpdir(), `ahoy-speech-${randomUUID()}.mp3`);
      await writeFile(file, Buffer.from(await response.arrayBuffer()));
      return file;
    } catch {
      return signal.aborted ? null : this.#fellBack("offline");
    }
  }

  #fellBack(reason: string): null {
    this.#options.logger.warn("voice", `Mac voice uses say: ${reason}`);
    return null;
  }

  async #play(file: string, signal: AbortSignal): Promise<boolean> {
    const played = await run("afplay", [file], { signal }).then(
      () => true,
      () => false,
    );
    await rm(file, { force: true });
    return played;
  }

  async #say(text: string, signal: AbortSignal): Promise<void> {
    const voice = await this.#sayVoiceArgs();
    if (signal.aborted) return;
    await run("say", [...voice, "--", text], { signal }).catch(() => undefined);
  }

  #sayVoiceArgs(): Promise<string[]> {
    this.#sayVoice ??= run("say", ["-v", "?"]).then(
      ({ stdout }) =>
        stdout.split("\n").some((line) => line.startsWith(PREFERRED_SAY_VOICE))
          ? ["-v", PREFERRED_SAY_VOICE]
          : [],
      () => [],
    );
    return this.#sayVoice;
  }
}
