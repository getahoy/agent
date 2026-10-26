import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  encodeBytes,
  generateKeyPair,
  type SecureChannel,
  startInitiator,
  startResponder,
} from "@getahoy/crypto";
import {
  frameSchema,
  MAX_AUDIO_CHUNK_BYTES,
  MAX_FRAME_BYTES,
} from "@getahoy/protocol";
import { encodeJson } from "../connection/jsonBytes.ts";

const EMPTY_PAYLOAD = new Uint8Array();

function phoneChannel(): SecureChannel {
  const phoneKeys = generateKeyPair();
  const macKeys = generateKeyPair();
  const initiator = startInitiator(phoneKeys, macKeys.publicKey);
  const responder = startResponder(macKeys);
  responder.readFirstMessage(initiator.firstMessage(EMPTY_PAYLOAD));
  const opened = initiator.readReply(responder.reply(EMPTY_PAYLOAD).message);
  assert.ok(opened);
  return opened.channel;
}

function chunkFrame(rawBytes: number) {
  return {
    type: "audio.chunk",
    commandId: randomUUID(),
    seq: Number.MAX_SAFE_INTEGER,
    data: encodeBytes(new Uint8Array(rawBytes)),
  };
}

test("the largest audio chunk fits in one sealed frame", () => {
  const parsed = frameSchema.safeParse(chunkFrame(MAX_AUDIO_CHUNK_BYTES));
  assert.ok(parsed.success);
  const sealed = phoneChannel().seal(encodeJson(parsed.data));
  assert.ok(
    sealed.byteLength <= MAX_FRAME_BYTES,
    `sealed chunk is ${sealed.byteLength} bytes`,
  );
});

test("a chunk one byte over the cap is refused", () => {
  const parsed = frameSchema.safeParse(chunkFrame(MAX_AUDIO_CHUNK_BYTES + 1));
  assert.equal(parsed.success, false);
});
