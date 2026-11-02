import type { DeviceDescription } from "@getahoy/protocol";
import type { PairingStatus } from "../../core/pairing/pairingStatus.ts";
import { pairingQr } from "../../core/pairing/pairingTerms.ts";
import type { IdentityStore } from "../identity/identityStore.ts";
import type { LanEndpoint } from "../lan/lanAddresses.ts";
import type { OpenCode } from "./pairingCompletion.ts";

type OfferParts = {
  identity: IdentityStore;
  device: () => DeviceDescription;
  lanEndpoint: () => LanEndpoint | null;
  lanListening: () => boolean;
};

export function codeOffer(
  parts: OfferParts,
  open: OpenCode,
): Extract<PairingStatus, { kind: "offering" }> {
  const lan = parts.lanEndpoint() ?? undefined;
  const { userCode, expiresAt } = open.code;
  const qr = pairingQr({
    userCode,
    displayName: parts.device().displayName,
    desktopPublicKey: parts.identity.encodedPublicKey(),
    pairingSecret: open.pairingSecret,
    expiresAt,
    lan,
  });
  const reachableOnLan = lan !== undefined && parts.lanListening();
  return { kind: "offering", qr, expiresAt, reachableOnLan };
}
