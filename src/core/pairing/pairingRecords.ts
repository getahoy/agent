import {
  bytes32Schema,
  type EndReason,
  endReasonSchema,
} from "@getahoy/protocol";
import { z } from "zod";
import type { PairedPhone } from "./pairedPhone.ts";

const ENDED_PHONE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export const endedPhoneSchema = z.object({
  publicKey: bytes32Schema,
  displayName: z.string(),
  reason: endReasonSchema,
  at: z.int(),
});

export const pendingUnlinkSchema = z.object({
  peerPublicKey: bytes32Schema,
  reason: z.enum(["removed", "signed_out"]),
});

export type EndedPhone = z.infer<typeof endedPhoneSchema>;
export type PendingUnlink = z.infer<typeof pendingUnlinkSchema>;

type EndInput = {
  phones: readonly PairedPhone[];
  ended: readonly EndedPhone[];
  reason: EndReason;
  now: number;
};

export function withEndedPhones({
  phones,
  ended,
  reason,
  now,
}: EndInput): EndedPhone[] {
  const endedKeys = new Set(phones.map((phone) => phone.publicKey));
  const kept = ended.filter((record) => !endedKeys.has(record.publicKey));
  const added = phones.map(({ publicKey, displayName }) => ({
    publicKey,
    displayName,
    reason,
    at: now,
  }));
  return [...kept, ...added];
}

export function recentEndedPhones(
  ended: readonly EndedPhone[],
  now: number,
): EndedPhone[] {
  return ended.filter((record) => now - record.at < ENDED_PHONE_RETENTION_MS);
}
