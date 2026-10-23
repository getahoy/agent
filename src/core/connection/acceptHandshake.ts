import {
  type KeyPair,
  type SecureChannel,
  startResponder,
} from "@getahoy/crypto";
import {
  type HandshakeReply,
  type Hello,
  helloSchema,
  PROTOCOL_VERSION,
  versionProbeSchema,
} from "@getahoy/protocol";
import type { PairedPhone } from "../pairing/pairedPhone.ts";
import { decodeJson, encodeJson } from "./jsonBytes.ts";

type HandshakeDecision =
  | { outcome: "dropped" }
  | { outcome: "refused"; reply: Uint8Array }
  | {
      outcome: "accepted";
      reply: Uint8Array;
      channel: SecureChannel;
      phone: PairedPhone;
      hello: Hello;
    };

type HandshakeInput = {
  firstMessage: Uint8Array;
  localKeys: KeyPair;
  localHello: Hello;
  findPhone: (publicKey: Uint8Array) => PairedPhone | null;
};

const DROPPED: HandshakeDecision = { outcome: "dropped" };

const versionRefusal: HandshakeReply = {
  type: "refused",
  reason: "protocol_version_mismatch",
  protocolVersion: PROTOCOL_VERSION,
};

export function acceptHandshake(input: HandshakeInput): HandshakeDecision {
  const responder = startResponder(input.localKeys);
  const opened = responder.readFirstMessage(input.firstMessage);
  if (!opened) return DROPPED;
  const phone = input.findPhone(opened.remotePublicKey);
  if (!phone) return DROPPED;
  const payload = decodeJson(opened.payload);
  const probe = versionProbeSchema.safeParse(payload);
  if (!probe.success) return DROPPED;
  if (probe.data.protocolVersion !== PROTOCOL_VERSION) {
    const reply = responder.reply(encodeJson(versionRefusal)).message;
    return { outcome: "refused", reply };
  }
  const hello = helloSchema.safeParse(payload);
  if (!hello.success) return DROPPED;
  const welcome: HandshakeReply = { type: "welcome", hello: input.localHello };
  const { message, channel } = responder.reply(encodeJson(welcome));
  return {
    outcome: "accepted",
    reply: message,
    channel,
    phone,
    hello: hello.data,
  };
}
