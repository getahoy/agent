import {
  type KeyPair,
  type SecureChannel,
  startResponder,
} from "@getahoy/crypto";
import {
  decodeJson,
  type EndReason,
  encodeJson,
  type HandshakeReply,
  type Hello,
  helloSchema,
  type LanEndpoint,
  PROTOCOL_VERSION,
  versionProbeSchema,
} from "@getahoy/protocol";
import type { PairedPhone } from "../pairing/pairedPhone.ts";

type HandshakeDecision =
  | { outcome: "dropped" }
  | { outcome: "closing"; reply: Uint8Array }
  | {
      outcome: "accepted";
      reply: Uint8Array;
      channel: SecureChannel;
      phone: PairedPhone;
    };

type HandshakeInput = {
  firstMessage: Uint8Array;
  localKeys: KeyPair;
  localHello: Hello;
  lan: LanEndpoint | null;
  findPhone: (publicKey: Uint8Array) => PairedPhone | null;
  findEnded: (publicKey: Uint8Array) => EndReason | null;
};

const DROPPED: HandshakeDecision = { outcome: "dropped" };
const UNKNOWN_MAC_KEY = encodeJson({ type: "unknown_mac_key" });

const versionMismatch: HandshakeReply = {
  type: "version_mismatch",
  protocolVersion: PROTOCOL_VERSION,
};

export function acceptHandshake(input: HandshakeInput): HandshakeDecision {
  const responder = startResponder(input.localKeys);
  const opened = responder.readFirstMessage(input.firstMessage);
  if (!opened) return { outcome: "closing", reply: UNKNOWN_MAC_KEY };
  const phone = input.findPhone(opened.remotePublicKey);
  if (!phone) {
    const detail = input.findEnded(opened.remotePublicKey) ?? "unknown";
    const notPaired: HandshakeReply = { type: "not_paired", detail };
    const reply = responder.reply(encodeJson(notPaired)).message;
    return { outcome: "closing", reply };
  }
  const payload = decodeJson(opened.payload);
  const probe = versionProbeSchema.safeParse(payload);
  if (!probe.success) return DROPPED;
  if (probe.data.protocolVersion !== PROTOCOL_VERSION) {
    const reply = responder.reply(encodeJson(versionMismatch)).message;
    return { outcome: "closing", reply };
  }
  if (!helloSchema.safeParse(payload).success) return DROPPED;
  const { localHello: hello, lan } = input;
  const welcome: HandshakeReply = lan
    ? { type: "welcome", hello, lan }
    : { type: "welcome", hello };
  const { message, channel } = responder.reply(encodeJson(welcome));
  return { outcome: "accepted", reply: message, channel, phone };
}
