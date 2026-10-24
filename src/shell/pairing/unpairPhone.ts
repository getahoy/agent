import type { Logger } from "@getahoy/lib";
import { dialog } from "electron";
import { agentCopy } from "../../copy/agentCopy.ts";
import type { AgentController } from "../agentController.ts";
import type { IdentityStore } from "../identity/identityStore.ts";
import type { PhoneLink } from "../lan/phoneLink.ts";
import { unlinkPairing } from "./pairingApi.ts";

const REMOVE_BUTTON = 0;
const CANCEL_BUTTON = 1;

type UnpairParts = {
  apiUrl: string;
  identity: IdentityStore;
  phoneLink: PhoneLink;
  controller: AgentController;
  logger: Logger;
};

async function confirmRemoval(phoneName: string): Promise<boolean> {
  const { response } = await dialog.showMessageBox({
    type: "warning",
    message: `${agentCopy["remove.title"]} ${phoneName}?`,
    detail: agentCopy["remove.body"],
    buttons: [agentCopy["remove.confirm"], agentCopy["remove.cancel"]],
    defaultId: CANCEL_BUTTON,
    cancelId: CANCEL_BUTTON,
  });
  return response === REMOVE_BUTTON;
}

export async function unpairPhone(
  parts: UnpairParts,
  publicKey: string,
): Promise<void> {
  const { apiUrl, identity, phoneLink, controller, logger } = parts;
  const phone = identity.pairedPhones().find((p) => p.publicKey === publicKey);
  if (!phone || !(await confirmRemoval(phone.displayName))) return;
  await identity.removePhone(publicKey);
  phoneLink.disconnect(publicKey);
  controller.setPairedPhones(identity.pairedPhones());
  logger.info("pairing", "Phone removed");
  const sessionToken = identity.sessionToken();
  if (!sessionToken) return;
  const unlinked = await unlinkPairing({
    apiUrl,
    sessionToken,
    body: {
      devicePublicKey: identity.encodedPublicKey(),
      peerPublicKey: publicKey,
    },
  });
  if (unlinked.code === "error") {
    logger.warn("pairing", "Server unlink failed, phone removed on this Mac");
  }
}
