import type { EndReason, GoodbyeReason } from "@getahoy/protocol";
import { app, BrowserWindow, Notification } from "electron";
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

async function endPairing(
  parts: PairingParts,
  phone: PairedPhone,
  reason: EndReason,
  whileAsleep: boolean,
): Promise<void> {
  const { identity, controller, logger } = parts;
  const trace = (step: string) => {
    if (!app.isPackaged) logger.info("pairing.end", step);
  };
  const learned = { at: Date.now(), whileAsleep };
  const phones = identity.pairedPhones();
  const ending = phoneEnding(phones, phone.publicKey, reason, learned);
  const withNotice = ending.kind === "ended" && ending.notice !== null;
  trace(`${reason}: ${ending.kind}, notice ${withNotice ? "yes" : "no"}`);
  if (ending.kind === "ignored") return;
  await identity.endPhone(phone.publicKey, reason);
  trace(`endPhone done, ${identity.pairedPhones().length} phones left`);
  parts.onPhoneEnded();
  controller.phoneEnded(identity.pairedPhones(), ending.notice);
  const { pairing: shown, endedNotice } = controller.state();
  trace(`state ${shown.kind}, notice ${endedNotice?.reason ?? "none"}`);
  if (ending.notice) notifyWhenUnseen(ending.notice);
}

export function phoneEndedPairing(
  parts: PairingParts,
  phone: PairedPhone,
  reason: EndReason,
  whileAsleep: boolean,
): void {
  endPairing(parts, phone, reason, whileAsleep).catch((error: unknown) =>
    parts.logger.error("pairing", "Ending the pairing failed", error),
  );
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
      phoneEndedPairing(parts, phone, reason, false);
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
