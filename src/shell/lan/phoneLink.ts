import type { Logger } from "@getahoy/lib";
import type { Hello } from "@getahoy/protocol";
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
  onConnectedPhones: (phones: readonly PairedPhone[]) => void;
};

export class PhoneLink {
  readonly #options: PhoneLinkOptions;
  readonly #listener: LanListener;
  readonly #connected = new Map<FrameStream, PairedPhone>();

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

  disconnect(publicKey: string): void {
    for (const [stream, phone] of this.#connected) {
      if (phone.publicKey === publicKey) stream.close();
    }
  }

  #accept(stream: FrameStream): void {
    const { identity, localHello, logger } = this.#options;
    new PhoneSession({
      stream,
      localKeys: identity.keyPair(),
      localHello,
      findPhone: (publicKey) => identity.pairedPhone(publicKey),
      handshakeTimeoutMs: HANDSHAKE_TIMEOUT_MS,
      onConnected: (phone) => {
        logger.info("lan", `Phone connected (${phone.platform})`);
        this.#connected.set(stream, phone);
        this.#emit();
      },
      onDisconnected: () => {
        logger.info("lan", "Phone disconnected");
        this.#connected.delete(stream);
        this.#emit();
      },
    });
  }

  #emit(): void {
    this.#options.onConnectedPhones([...this.#connected.values()]);
  }
}
