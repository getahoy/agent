import type { EndReason } from "@getahoy/protocol";
import type { PairedPhone } from "./pairedPhone.ts";
import type { PairingStatus } from "./pairingStatus.ts";

export type PhoneEndReason = Exclude<EndReason, "replaced">;

export type EndedByPhone = {
  reason: PhoneEndReason;
  deviceName: string;
  at: number;
  whileAsleep: boolean;
};

export type PhoneEnding =
  | { kind: "ignored" }
  | { kind: "ended"; notice: EndedByPhone | null };

type Learned = { at: number; whileAsleep: boolean };

export function phoneEnding(
  phones: readonly PairedPhone[],
  publicKey: string,
  reason: EndReason,
  learned: Learned,
): PhoneEnding {
  const phone = phones.find((candidate) => candidate.publicKey === publicKey);
  if (!phone) return { kind: "ignored" };
  if (reason === "replaced") return { kind: "ended", notice: null };
  const notice = { reason, deviceName: phone.displayName, ...learned };
  return { kind: "ended", notice };
}

const CODE_IN_PROGRESS: ReadonlySet<PairingStatus["kind"]> = new Set([
  "starting",
  "slow",
  "offering",
  "refreshing",
  "offline",
  "scanned",
]);

export function keepsCurrentCode(status: PairingStatus): boolean {
  return CODE_IN_PROGRESS.has(status.kind);
}
