import type { EndReason, GoodbyeReason } from "@getahoy/protocol";
import { Notification } from "electron";
import { agentCopy } from "../../copy/agentCopy.ts";
import type { PairedPhone } from "../../core/pairing/pairedPhone.ts";
import type { PairingParts } from "./pairingParts.ts";

type EndedByPhone = Exclude<EndReason, "replaced">;

const endedNoticeCopy: Record<EndedByPhone, string> = {
  removed: agentCopy["ended.removed"],
  signed_out: agentCopy["ended.signedOut"],
};

export async function phoneEndedPairing(
  parts: PairingParts,
  phone: PairedPhone,
  reason: EndReason,
): Promise<void> {
  const { identity, controller, logger } = parts;
  await identity.endPhone(phone.publicKey, reason);
  controller.setPairedPhones(identity.pairedPhones());
  logger.info("pairing", `Phone ended the pairing (${reason})`);
  if (reason === "replaced") return;
  controller.showEndedNotice({ phoneName: phone.displayName, reason });
  const title = `${phone.displayName} ${endedNoticeCopy[reason]}`;
  new Notification({ title }).show();
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
      void phoneEndedPairing(parts, phone, reason);
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
