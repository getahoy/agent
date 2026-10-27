import type { KeyPair, SecureChannel } from "@getahoy/crypto";
import {
  type EndReason,
  type Frame,
  frameSchema,
  type GoodbyeReason,
  type Hello,
} from "@getahoy/protocol";
import type { FrameStream } from "../../ports/frameStream.ts";
import type { PairedPhone } from "../pairing/pairedPhone.ts";
import { acceptHandshake } from "./acceptHandshake.ts";
import { decodeJson, encodeJson } from "./jsonBytes.ts";

type PhoneSessionOptions = {
  stream: FrameStream;
  localKeys: KeyPair;
  localHello: Hello;
  findPhone: (publicKey: Uint8Array) => PairedPhone | null;
  findEnded: (publicKey: Uint8Array) => EndReason | null;
  isLocked: () => boolean;
  handshakeTimeoutMs: number;
  onConnected: (phone: PairedPhone, session: PhoneSession) => void;
  onDisconnected: (phone: PairedPhone, session: PhoneSession) => void;
  onGoodbye: (phone: PairedPhone, reason: GoodbyeReason) => void;
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

  end(reason: GoodbyeReason): void {
    this.#send({ type: "goodbye", reason });
    this.#options.stream.close();
  }

  sendStatus(locked: boolean): void {
    this.#send({ type: "status", locked });
  }

  #send(frame: Frame): void {
    const phase = this.#phase;
    if (phase.kind !== "connected" && phase.kind !== "awaitingReady") return;
    this.#options.stream.send(phase.channel.seal(encodeJson(frame)));
  }

  #receive(frame: Uint8Array): void {
    const phase = this.#phase;
    if (phase.kind === "awaitingHello") {
      this.#greet(frame);
      return;
    }
    if (phase.kind === "closed") return;
    const opened = phase.channel.open(frame);
    const parsed = opened ? frameSchema.safeParse(decodeJson(opened)) : null;
    if (!parsed?.success) {
      this.#options.stream.close();
      return;
    }
    this.#handle(parsed.data, phase.channel, phase.phone);
  }

  #handle(frame: Frame, channel: SecureChannel, phone: PairedPhone): void {
    switch (frame.type) {
      case "ready":
        this.#markConnected(channel, phone);
        return;
      case "goodbye":
        this.#options.onGoodbye(phone, frame.reason);
        this.#options.stream.close();
        return;
      case "ping":
        this.#send({ type: "pong" });
        return;
      case "status":
      case "pong":
      case "command":
      case "command.received":
      case "command.result":
        return;
      default: {
        const unhandled: never = frame;
        throw new Error(`Unhandled frame ${JSON.stringify(unhandled)}`);
      }
    }
  }

  #greet(firstMessage: Uint8Array): void {
    const { stream, localKeys, localHello, findPhone, findEnded } =
      this.#options;
    const decision = acceptHandshake({
      firstMessage,
      localKeys,
      localHello,
      findPhone,
      findEnded,
    });
    if (decision.outcome !== "dropped") stream.send(decision.reply);
    if (decision.outcome !== "accepted") {
      stream.close();
      return;
    }
    const { channel, phone } = decision;
    this.#phase = { kind: "awaitingReady", channel, phone };
  }

  #markConnected(channel: SecureChannel, phone: PairedPhone): void {
    if (this.#phase.kind === "connected") return;
    clearTimeout(this.#handshakeTimer);
    this.#phase = { kind: "connected", channel, phone };
    this.sendStatus(this.#options.isLocked());
    this.#options.onConnected(phone, this);
  }

  #closed(): void {
    const phase = this.#phase;
    clearTimeout(this.#handshakeTimer);
    this.#phase = { kind: "closed" };
    if (phase.kind !== "connected") return;
    this.#options.onDisconnected(phase.phone, this);
  }
}
