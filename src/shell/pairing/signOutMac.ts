import { agentCopy } from "../../copy/agentCopy.ts";
import type { PairingParts } from "./pairingParts.ts";
import { confirmed } from "./unpairPhone.ts";

export async function signOutMac(parts: PairingParts): Promise<void> {
  const { identity, phoneLink, controller, monitor, authClient, logger } =
    parts;
  const phones = identity.pairedPhones();
  const names = phones.map((phone) => phone.displayName).join(", ");
  const signOut = await confirmed({
    message: agentCopy["signOut.title"],
    detail: names
      ? `${names} ${agentCopy["signOut.bodyWithPhone"]}`
      : agentCopy["signOut.body"],
    confirm: agentCopy["signOut.confirm"],
  });
  if (!signOut) return;
  phoneLink.endAll("signed_out");
  for (const phone of phones) {
    await identity.queueUnlink({
      peerPublicKey: phone.publicKey,
      reason: "signed_out",
    });
  }
  await monitor.flushUnlinks();
  const sessionToken = identity.sessionToken();
  if (sessionToken) {
    const authorization = `Bearer ${sessionToken}`;
    await authClient
      .signOut({ fetchOptions: { headers: { authorization } } })
      .catch(() => undefined);
  }
  await identity.signOut();
  controller.setPairedPhones([]);
  logger.info("pairing", "Signed out on this Mac");
}
