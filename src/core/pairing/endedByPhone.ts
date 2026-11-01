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

export type NoticeAge =
  | { kind: "justNow" }
  | { kind: "minutes"; count: number }
  | { kind: "hours"; count: number };

type Learned = { at: number; whileAsleep: boolean };

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_SHOWN = 24;
export const NOTICE_LIFETIME_MS =
  HOURS_SHOWN * MINUTES_PER_HOUR * MS_PER_MINUTE;

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

export function keepsCurrentCode(status: PairingStatus): boolean {
  return status.kind === "offering" || status.kind === "starting";
}

export function noticeShown(notice: EndedByPhone, now: number): boolean {
  return now - notice.at < NOTICE_LIFETIME_MS;
}

export function noticeAge(at: number, now: number): NoticeAge {
  const minutes = Math.floor((now - at) / MS_PER_MINUTE);
  if (minutes < 1) return { kind: "justNow" };
  if (minutes < MINUTES_PER_HOUR) return { kind: "minutes", count: minutes };
  return { kind: "hours", count: Math.floor(minutes / MINUTES_PER_HOUR) };
}
