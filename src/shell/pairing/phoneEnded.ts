import type { EndReason, GoodbyeReason } from "@getahoy/protocol";
import { BrowserWindow, Notification } from "electron";
import { endedNotificationCopy } from "../../copy/endedCopy.ts";
import {
  type EndedByPhone,
  phoneEnding,
} from "../../core/pairing/endedByPhone.ts";
import type { PairedPhone } from "../../core/pairing/pairedPhone.ts";
import type { PairingParts } from "./pairingParts.ts";

function notifyWhenUnseen(notice: EndedByPhone): void {
  if (BrowserWindow.getAllWindows().some((window) => window.isVisible())) {
    return;
  }
  const copy = endedNotificationCopy[notice.reason];
  const title = copy.title(notice.deviceName);
  new Notification({ title, body: copy.body }).show();
}

export async function phoneEndedPairing(
  parts: PairingParts,
  phone: PairedPhone,
  reason: EndReason,
  whileAsleep: boolean,
): Promise<void> {
  const { identity, controller, pairing, logger } = parts;
  const learned = { at: Date.now(), whileAsleep };
  const ending = phoneEnding(
    identity.pairedPhones(),
    phone.publicKey,
    reason,
    learned,
  );
  if (ending.kind === "ignored") return;
  await identity.endPhone(phone.publicKey, reason);
  parts.onPhoneEnded();
  controller.setPairedPhones(identity.pairedPhones());
  controller.phoneEnded(ending.notice);
  pairing.restartAfterPhoneEnded();
  logger.info("pairing", `Phone ended the pairing (${reason})`);
  if (ending.notice) notifyWhenUnseen(ending.notice);
}

export function handlePhoneGoodbye(
  parts: PairingParts,
  phone: PairedPhone,
  reason: GoodbyeReason,
): void {
  switch (reason) {
    case "paused":
      parts.controller.setPhonePaused(phone.publicKey);
      return;
    case "removed":
    case "signed_out":
      void phoneEndedPairing(parts, phone, reason, false);
      return;
    case "replaced":
    case "turned_off":
    case "quitting":
    case "sleeping":
      return;
    default: {
      const unhandled: never = reason;
      throw new Error(`Unhandled goodbye ${String(unhandled)}`);
    }
  }
}
