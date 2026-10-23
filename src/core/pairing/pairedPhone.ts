import { bytes32Schema, platformSchema } from "@getahoy/protocol";
import { z } from "zod";

export const pairedPhoneSchema = z.object({
  publicKey: bytes32Schema,
  displayName: z.string(),
  platform: platformSchema,
  accountEmail: z.email(),
  pairedAt: z.int(),
});

export type PairedPhone = z.infer<typeof pairedPhoneSchema>;
