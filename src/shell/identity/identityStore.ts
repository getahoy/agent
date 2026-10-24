import { readFile, rename } from "node:fs/promises";
import {
  decodeBytes,
  encodeBytes,
  generateKeyPair,
  type KeyPair,
} from "@getahoy/crypto";
import type { Logger } from "@getahoy/lib";
import { bytes32Schema } from "@getahoy/protocol";
import { safeStorage } from "electron";
import writeFileAtomic from "write-file-atomic";
import { z } from "zod";
import {
  type PairedPhone,
  pairedPhoneSchema,
} from "../../core/pairing/pairedPhone.ts";

const OWNER_ONLY_FILE_MODE = 0o600;

const identitySchema = z.object({
  publicKey: bytes32Schema,
  secretKey: bytes32Schema,
  desktopId: z.uuid().nullable(),
  sessionToken: z.string().min(1).nullable(),
  pairedPhones: z.array(pairedPhoneSchema),
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
  };
}

function decryptIdentity(sealed: Buffer): Identity | null {
  try {
    const parsed = identitySchema.safeParse(
      JSON.parse(safeStorage.decryptString(sealed)),
    );
    return parsed.success ? parsed.data : null;
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

  pairedPhones(): readonly PairedPhone[] {
    return this.#identity.pairedPhones;
  }

  pairedPhone(publicKey: Uint8Array): PairedPhone | null {
    const encoded = encodeBytes(publicKey);
    const phones = this.#identity.pairedPhones;
    return phones.find((phone) => phone.publicKey === encoded) ?? null;
  }

  sessionToken(): string | null {
    return this.#identity.sessionToken;
  }

  async removePhone(publicKey: string): Promise<void> {
    this.#identity = {
      ...this.#identity,
      pairedPhones: this.#identity.pairedPhones.filter(
        (phone) => phone.publicKey !== publicKey,
      ),
    };
    await this.#save();
  }

  async completePairing(pairing: CompletedPairing): Promise<void> {
    const others = this.#identity.pairedPhones.filter(
      (phone) => phone.publicKey !== pairing.phone.publicKey,
    );
    this.#identity = {
      ...this.#identity,
      desktopId: pairing.desktopId,
      sessionToken: pairing.sessionToken,
      pairedPhones: [...others, pairing.phone],
    };
    await this.#save();
  }

  async #save(): Promise<void> {
    const sealed = safeStorage.encryptString(JSON.stringify(this.#identity));
    await writeFileAtomic(this.#filePath, sealed, {
      mode: OWNER_ONLY_FILE_MODE,
    });
  }
}
