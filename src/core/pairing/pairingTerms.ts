import { decodeBytes, encodeBytes, proofMatches } from "@getahoy/crypto";
import type { PairingComplete, PairingQr } from "@getahoy/protocol";
import type { PairedPhone } from "./pairedPhone.ts";

type PairingQrInput = {
  userCode: string;
  displayName: string;
  desktopPublicKey: string;
  pairingSecret: Uint8Array;
  expiresAt: number;
  lan: PairingQr["lan"];
};

export function pairingQr(input: PairingQrInput): string {
  const payload: PairingQr = {
    v: 1,
    pk: input.desktopPublicKey,
    name: input.displayName,
    code: input.userCode,
    psk: encodeBytes(input.pairingSecret),
    exp: input.expiresAt,
  };
  return JSON.stringify(input.lan ? { ...payload, lan: input.lan } : payload);
}

type ClaimCheck = {
  complete: PairingComplete;
  desktopPublicKey: string;
  pairingSecret: Uint8Array;
  now: number;
};

export function verifiedPhone(check: ClaimCheck): PairedPhone | null {
  const { phone, proof, accountEmail } = check.complete;
  const genuine = proofMatches(
    {
      pairingSecret: check.pairingSecret,
      phonePublicKey: decodeBytes(phone.publicKey),
      desktopPublicKey: decodeBytes(check.desktopPublicKey),
    },
    decodeBytes(proof),
  );
  if (!genuine) return null;
  return {
    publicKey: phone.publicKey,
    displayName: phone.displayName,
    platform: phone.platform,
    accountEmail,
    pairedAt: check.now,
  };
}
