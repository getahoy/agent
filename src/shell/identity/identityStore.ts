import { readFile, rename } from "node:fs/promises";
import {
  decodeBytes,
  encodeBytes,
  generateKeyPair,
  type KeyPair,
} from "@getahoy/crypto";
import type { Logger } from "@getahoy/lib";
import { bytes32Schema, type EndReason } from "@getahoy/protocol";
import { safeStorage } from "electron";
import writeFileAtomic from "write-file-atomic";
import { z } from "zod";
import {
  type PairedPhone,
  pairedPhoneSchema,
} from "../../core/pairing/pairedPhone.ts";
import {
  endedPhoneSchema,
  type PendingUnlink,
  pendingUnlinkSchema,
  recentEndedPhones,
  withEndedPhones,
} from "../../core/pairing/pairingRecords.ts";

const OWNER_ONLY_FILE_MODE = 0o600;

const identitySchema = z.object({
  publicKey: bytes32Schema,
  secretKey: bytes32Schema,
  desktopId: z.uuid().nullable(),
  sessionToken: z.string().min(1).nullable(),
  pairedPhones: z.array(pairedPhoneSchema),
  endedPhones: z.array(endedPhoneSchema).default([]),
  pendingUnlinks: z.array(pendingUnlinkSchema).default([]),
});

type Identity = z.infer<typeof identitySchema>;

type CompletedPairing = {
  desktopId: string;
  sessionToken: string;
  phone: PairedPhone;
};

function freshIdentity(): Identity {
  const keys = generateKeyPair();
  return {
    publicKey: encodeBytes(keys.publicKey),
    secretKey: encodeBytes(keys.secretKey),
    desktopId: null,
    sessionToken: null,
    pairedPhones: [],
    endedPhones: [],
    pendingUnlinks: [],
  };
}

function decryptIdentity(sealed: Buffer): Identity | null {
  try {
    const parsed = identitySchema.safeParse(
      JSON.parse(safeStorage.decryptString(sealed)),
    );
    if (!parsed.success) return null;
    const endedPhones = recentEndedPhones(parsed.data.endedPhones, Date.now());
    return { ...parsed.data, endedPhones };
  } catch {
    return null;
  }
}

export class IdentityStore {
  readonly #filePath: string;
  #identity: Identity;

  private constructor(filePath: string, identity: Identity) {
    this.#filePath = filePath;
    this.#identity = identity;
  }

  static async open(filePath: string, logger: Logger): Promise<IdentityStore> {
    const sealed = await readFile(filePath).catch(() => null);
    const stored = sealed ? decryptIdentity(sealed) : null;
    if (sealed && !stored) {
      await rename(filePath, `${filePath}.unreadable`);
      logger.warn(
        "identity",
        "Unreadable identity kept aside, starting unpaired",
      );
    }
    const store = new IdentityStore(filePath, stored ?? freshIdentity());
    if (!stored) await store.#save();
    return store;
  }

  keyPair(): KeyPair {
    return {
      publicKey: decodeBytes(this.#identity.publicKey),
      secretKey: decodeBytes(this.#identity.secretKey),
    };
  }

  encodedPublicKey(): string {
    return this.#identity.publicKey;
  }

  sessionToken(): string | null {
    return this.#identity.sessionToken;
  }

  pairedPhones(): readonly PairedPhone[] {
    return this.#identity.pairedPhones;
  }

  pairedPhone(publicKey: Uint8Array): PairedPhone | null {
    const encoded = encodeBytes(publicKey);
    const phones = this.#identity.pairedPhones;
    return phones.find((phone) => phone.publicKey === encoded) ?? null;
  }

  endReason(publicKey: Uint8Array): EndReason | null {
    const encoded = encodeBytes(publicKey);
    const ended = this.#identity.endedPhones;
    return ended.find((record) => record.publicKey === encoded)?.reason ?? null;
  }

  pendingUnlinks(): readonly PendingUnlink[] {
    return this.#identity.pendingUnlinks;
  }

  async endPhone(publicKey: string, reason: EndReason): Promise<void> {
    const { pairedPhones } = this.#identity;
    const isEnding = (phone: PairedPhone) => phone.publicKey === publicKey;
    await this.#update({
      pairedPhones: pairedPhones.filter((phone) => !isEnding(phone)),
      endedPhones: this.#ended(pairedPhones.filter(isEnding), reason),
    });
  }

  async completePairing(pairing: CompletedPairing): Promise<PairedPhone[]> {
    const replaced = this.#identity.pairedPhones.filter(
      (phone) => phone.publicKey !== pairing.phone.publicKey,
    );
    const endedPhones = this.#ended(replaced, "replaced").filter(
      (record) => record.publicKey !== pairing.phone.publicKey,
    );
    const { desktopId, sessionToken, phone } = pairing;
    const pairedPhones = [phone];
    await this.#update({ desktopId, sessionToken, pairedPhones, endedPhones });
    return replaced;
  }

  async queueUnlink(unlink: PendingUnlink): Promise<void> {
    const pendingUnlinks = [...this.#identity.pendingUnlinks, unlink];
    await this.#update({ pendingUnlinks });
  }

  async settleUnlink(peerPublicKey: string): Promise<void> {
    const pendingUnlinks = this.#identity.pendingUnlinks.filter(
      (unlink) => unlink.peerPublicKey !== peerPublicKey,
    );
    await this.#update({ pendingUnlinks });
  }

  async signOut(): Promise<void> {
    await this.#update({
      desktopId: null,
      sessionToken: null,
      pairedPhones: [],
      endedPhones: this.#ended(this.#identity.pairedPhones, "signed_out"),
      pendingUnlinks: [],
    });
  }

  #ended(phones: readonly PairedPhone[], reason: EndReason) {
    const ended = this.#identity.endedPhones;
    return withEndedPhones({ phones, ended, reason, now: Date.now() });
  }

  async #update(change: Partial<Identity>): Promise<void> {
    this.#identity = { ...this.#identity, ...change };
    await this.#save();
  }

  async #save(): Promise<void> {
    const sealed = safeStorage.encryptString(JSON.stringify(this.#identity));
    await writeFileAtomic(this.#filePath, sealed, {
      mode: OWNER_ONLY_FILE_MODE,
    });
  }
}
