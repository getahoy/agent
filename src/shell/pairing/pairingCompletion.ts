import type { Logger } from "@getahoy/lib";
import type { DeviceDescription } from "@getahoy/protocol";
import type { PairedPhone } from "../../core/pairing/pairedPhone.ts";
import type { CodeEvent } from "../../core/pairing/pairingCode.ts";
import { pairingFailure } from "../../core/pairing/pairingStatus.ts";
import { verifiedPhone } from "../../core/pairing/pairingTerms.ts";
import type { IdentityStore } from "../identity/identityStore.ts";
import type { IssuedCode } from "./deviceFlow.ts";
import { completePairing } from "./pairingApi.ts";

export type OpenCode = { code: IssuedCode; pairingSecret: Uint8Array };

type Completion = {
  apiUrl: string;
  identity: IdentityStore;
  desktop: DeviceDescription;
  logger: Logger;
  onReplaced: (phones: readonly PairedPhone[]) => void;
};

export async function completeClaim(
  completion: Completion,
  open: OpenCode,
  sessionToken: string,
): Promise<CodeEvent> {
  const { apiUrl, identity, desktop, logger } = completion;
  const completed = await completePairing({
    apiUrl,
    sessionToken,
    body: { userCode: open.code.userCode, device: desktop },
  });
  if (completed.code === "error") {
    return { kind: "refused", reason: pairingFailure(completed.error) };
  }
  const phone = verifiedPhone({
    complete: completed.data,
    desktopPublicKey: desktop.publicKey,
    pairingSecret: open.pairingSecret,
    now: Date.now(),
  });
  if (!phone) {
    logger.warn("pairing", "Claim proof did not match, pairing refused");
    return { kind: "refused", reason: "proofRejected" };
  }
  const { desktopId } = completed.data;
  const replaced = await identity.completePairing({
    desktopId,
    sessionToken,
    phone,
  });
  completion.onReplaced(replaced);
  logger.info("pairing", "Phone paired");
  const { displayName: phoneName, accountEmail } = phone;
  return { kind: "paired", phoneName, accountEmail };
}
