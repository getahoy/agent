import type { KeyPair, SecureChannel } from "@getahoy/crypto";
import { frameSchema, type Hello } from "@getahoy/protocol";
import type { FrameStream } from "../../ports/frameStream.ts";
import type { PairedPhone } from "../pairing/pairedPhone.ts";
import { acceptHandshake } from "./acceptHandshake.ts";
import { decodeJson } from "./jsonBytes.ts";

type PhoneSessionOptions = {
  stream: FrameStream;
  localKeys: KeyPair;
  localHello: Hello;
  findPhone: (publicKey: Uint8Array) => PairedPhone | null;
  handshakeTimeoutMs: number;
  onConnected: (phone: PairedPhone) => void;
  onDisconnected: (phone: PairedPhone) => void;
};

type Phase =
  | { kind: "awaitingHello" }
  | { kind: "awaitingReady"; channel: SecureChannel; phone: PairedPhone }
  | { kind: "connected"; channel: SecureChannel; phone: PairedPhone }
  | { kind: "closed" };

export class PhoneSession {
  readonly #options: PhoneSessionOptions;
  readonly #handshakeTimer: ReturnType<typeof setTimeout>;
  #phase: Phase = { kind: "awaitingHello" };

  constructor(options: PhoneSessionOptions) {
    this.#options = options;
    this.#handshakeTimer = setTimeout(() => {
      if (this.#phase.kind !== "connected") options.stream.close();
    }, options.handshakeTimeoutMs);
    options.stream.onFrame((frame) => this.#receive(frame));
    options.stream.onClose(() => this.#closed());
  }

  #receive(frame: Uint8Array): void {
    const phase = this.#phase;
    switch (phase.kind) {
      case "awaitingHello":
        this.#greet(frame);
        return;
      case "awaitingReady":
      case "connected":
        this.#readFrame(phase.channel, phase.phone, frame);
        return;
      case "closed":
        return;
      default: {
        const unhandled: never = phase;
        throw new Error(`Unhandled session phase ${JSON.stringify(unhandled)}`);
      }
    }
  }

  #greet(firstMessage: Uint8Array): void {
    const { stream, localKeys, localHello, findPhone } = this.#options;
    const decision = acceptHandshake({
      firstMessage,
      localKeys,
      localHello,
      findPhone,
    });
    if (decision.outcome === "dropped") {
      stream.close();
      return;
    }
    stream.send(decision.reply);
    if (decision.outcome === "refused") {
      stream.close();
      return;
    }
    const { channel, phone } = decision;
    this.#phase = { kind: "awaitingReady", channel, phone };
  }

  #readFrame(
    channel: SecureChannel,
    phone: PairedPhone,
    sealed: Uint8Array,
  ): void {
    const opened = channel.open(sealed);
    const frame = opened ? frameSchema.safeParse(decodeJson(opened)) : null;
    if (!frame?.success) {
      this.#options.stream.close();
      return;
    }
    switch (frame.data.type) {
      case "ready":
        this.#markConnected(channel, phone);
        return;
      default: {
        const unhandled: never = frame.data.type;
        throw new Error(`Unhandled frame ${JSON.stringify(unhandled)}`);
      }
    }
  }

  #markConnected(channel: SecureChannel, phone: PairedPhone): void {
    if (this.#phase.kind === "connected") return;
    clearTimeout(this.#handshakeTimer);
    this.#phase = { kind: "connected", channel, phone };
    this.#options.onConnected(phone);
  }

  #closed(): void {
    const phase = this.#phase;
    clearTimeout(this.#handshakeTimer);
    this.#phase = { kind: "closed" };
    if (phase.kind === "connected") this.#options.onDisconnected(phase.phone);
  }
}
