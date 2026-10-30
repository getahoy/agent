import type { PairingParts } from "./pairingParts.ts";

export async function signOutMac(parts: PairingParts): Promise<void> {
  const { identity, phoneLink, controller, monitor, authClient, logger } =
    parts;
  const phones = identity.pairedPhones();
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
