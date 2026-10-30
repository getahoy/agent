import type { PairingParts } from "./pairingParts.ts";

export async function unpairPhone(
  parts: PairingParts,
  publicKey: string,
): Promise<void> {
  const { identity, phoneLink, controller, monitor, logger } = parts;
  const phone = identity.pairedPhones().find((p) => p.publicKey === publicKey);
  if (!phone) return;
  await identity.endPhone(publicKey, "removed");
  controller.setPairedPhones(identity.pairedPhones());
  phoneLink.end(publicKey, "removed");
  await identity.queueUnlink({ peerPublicKey: publicKey, reason: "removed" });
  logger.info("pairing", "Phone removed");
  await monitor.flushUnlinks();
}
