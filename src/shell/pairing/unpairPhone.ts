import { dialog } from "electron";
import { agentCopy } from "../../copy/agentCopy.ts";
import type { PairingParts } from "./pairingParts.ts";

const CONFIRM_BUTTON = 0;
const CANCEL_BUTTON = 1;

type Confirmation = { message: string; detail: string; confirm: string };

export async function confirmed(confirmation: Confirmation): Promise<boolean> {
  const { response } = await dialog.showMessageBox({
    type: "warning",
    message: confirmation.message,
    detail: confirmation.detail,
    buttons: [confirmation.confirm, agentCopy["remove.cancel"]],
    defaultId: CANCEL_BUTTON,
    cancelId: CANCEL_BUTTON,
  });
  return response === CONFIRM_BUTTON;
}

export async function unpairPhone(
  parts: PairingParts,
  publicKey: string,
): Promise<void> {
  const { identity, phoneLink, controller, monitor, logger } = parts;
  const phone = identity.pairedPhones().find((p) => p.publicKey === publicKey);
  if (!phone) return;
  const remove = await confirmed({
    message: `${agentCopy["remove.title"]} ${phone.displayName}?`,
    detail: agentCopy["remove.body"],
    confirm: agentCopy["remove.confirm"],
  });
  if (!remove) return;
  await identity.endPhone(publicKey, "removed");
  controller.setPairedPhones(identity.pairedPhones());
  phoneLink.end(publicKey, "removed");
  await identity.queueUnlink({ peerPublicKey: publicKey, reason: "removed" });
  logger.info("pairing", "Phone removed");
  await monitor.flushUnlinks();
}
