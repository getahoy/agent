import type { RequestError } from "@getahoy/lib";
import { z } from "zod";

const pairingFailureSchema = z.enum([
  "network",
  "server",
  "updateRequired",
  "proofRejected",
]);

export const pairingStatusSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("idle") }),
  z.object({ kind: z.literal("starting") }),
  z.object({
    kind: z.literal("offering"),
    qr: z.string(),
    expiresAt: z.int(),
    reachableOnLan: z.boolean(),
  }),
  z.object({ kind: z.literal("failed"), reason: pairingFailureSchema }),
  z.object({
    kind: z.literal("paired"),
    phoneName: z.string(),
    accountEmail: z.string(),
  }),
]);

export type PairingFailure = z.infer<typeof pairingFailureSchema>;
export type PairingStatus = z.infer<typeof pairingStatusSchema>;

export function pairingFailure(error: RequestError): PairingFailure {
  switch (error.kind) {
    case "network":
      return "network";
    case "malformed":
      return "server";
    case "api":
      return error.detail.code === "protocol_version_mismatch"
        ? "updateRequired"
        : "server";
    default: {
      const unhandled: never = error;
      return unhandled;
    }
  }
}
