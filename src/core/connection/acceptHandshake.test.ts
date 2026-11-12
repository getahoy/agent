import assert from "node:assert/strict";
import { test } from "node:test";
import {
  encodeBytes,
  generateKeyPair,
  type KeyPair,
  startInitiator,
} from "@getahoy/crypto";
import {
  decodeJson,
  encodeJson,
  handshakeReplySchema,
  type LanEndpoint,
  PROTOCOL_VERSION,
} from "@getahoy/protocol";
import { acceptHandshake } from "./acceptHandshake.ts";

const hello = {
  protocolVersion: PROTOCOL_VERSION,
  platform: "macos" as const,
  appVersion: "1.0.0",
  capabilities: [],
};
const LAN: LanEndpoint = {
  hosts: ["192.168.1.20"],
  port: 7421,
  local: "Studio.local",
};

function welcomeFrom(lan: LanEndpoint | null) {
  const mac = generateKeyPair();
  const phone: KeyPair = generateKeyPair();
  const initiator = startInitiator(phone, mac.publicKey);
  const phoneHello = { ...hello, platform: "ios" as const };
  const decision = acceptHandshake({
    firstMessage: initiator.firstMessage(encodeJson(phoneHello)),
    localKeys: mac,
    localHello: hello,
    lan,
    findPhone: (publicKey) => ({
      publicKey: encodeBytes(publicKey),
      displayName: "Phone",
      platform: "ios",
      accountEmail: "someone@example.com",
      pairedAt: 1,
    }),
    findEnded: () => null,
  });
  assert.equal(decision.outcome, "accepted");
  if (decision.outcome !== "accepted") return null;
  const opened = initiator.readReply(decision.reply);
  assert.ok(opened);
  return handshakeReplySchema.parse(decodeJson(opened.payload));
}

test("the welcome carries the Mac's current lan endpoint", () => {
  assert.deepEqual(welcomeFrom(LAN), { type: "welcome", hello, lan: LAN });
});

test("a Mac with no lan address sends a welcome without lan", () => {
  assert.deepEqual(welcomeFrom(null), { type: "welcome", hello });
});
