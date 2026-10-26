import type { Logger } from "@getahoy/lib";
import type { GoodbyeReason, Hello } from "@getahoy/protocol";
import { PhoneSession } from "../../core/connection/phoneSession.ts";
import type { PairedPhone } from "../../core/pairing/pairedPhone.ts";
import type { FrameStream } from "../../ports/frameStream.ts";
import type { IdentityStore } from "../identity/identityStore.ts";
import { LanListener } from "./lanListener.ts";

const HANDSHAKE_TIMEOUT_MS = 10_000;

type PhoneLinkOptions = {
  port: number;
  identity: IdentityStore;
  localHello: Hello;
  logger: Logger;
  isLocked: () => boolean;
  onConnectedPhones: (publicKeys: string[]) => void;
  onGoodbye: (phone: PairedPhone, reason: GoodbyeReason) => void;
};

export class PhoneLink {
  readonly #options: PhoneLinkOptions;
  readonly #listener: LanListener;
  readonly #sessions = new Map<string, PhoneSession>();

  constructor(options: PhoneLinkOptions) {
    this.#options = options;
    this.#listener = new LanListener({
      port: options.port,
      logger: options.logger,
      onStream: (stream) => this.#accept(stream),
    });
  }

  start(): void {
    this.#listener.start();
  }

  stop(): void {
    this.#listener.stop();
  }

  end(publicKey: string, reason: GoodbyeReason): void {
    this.#sessions.get(publicKey)?.end(reason);
  }

  endAll(reason: GoodbyeReason): void {
    for (const session of this.#sessions.values()) session.end(reason);
  }

  broadcastStatus(locked: boolean): void {
    for (const session of this.#sessions.values()) session.sendStatus(locked);
  }

  #accept(stream: FrameStream): void {
    const { identity, localHello, logger, isLocked, onGoodbye } = this.#options;
    new PhoneSession({
      stream,
      localKeys: identity.keyPair(),
      localHello,
      findPhone: (publicKey) => identity.pairedPhone(publicKey),
      findEnded: (publicKey) => identity.endReason(publicKey),
      isLocked,
      handshakeTimeoutMs: HANDSHAKE_TIMEOUT_MS,
      onConnected: (phone, session) => {
        logger.info("lan", `Phone connected (${phone.platform})`);
        this.#sessions.set(phone.publicKey, session);
        this.#emit();
      },
      onDisconnected: (phone, session) => {
        logger.info("lan", "Phone disconnected");
        if (this.#sessions.get(phone.publicKey) === session) {
          this.#sessions.delete(phone.publicKey);
        }
        this.#emit();
      },
      onGoodbye,
    });
  }

  #emit(): void {
    this.#options.onConnectedPhones([...this.#sessions.keys()]);
  }
}
