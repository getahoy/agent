import type { PairingFailure } from "../core/pairing/pairingStatus.ts";

export type CaptionKind =
  | "ready"
  | "making"
  | "refreshing"
  | "slow"
  | "failed"
  | "offline"
  | "expired"
  | "scanned";

export type FrameLabel = "ready" | "making" | "none" | "scanned";

type Caption = { first: string; second: string };

const EVERY_FIVE_MINUTES = "A new code appears every 5 minutes";

export const captionCopy: Record<CaptionKind, Caption> = {
  ready: {
    first: "Scan with the Ahoy app on your iPhone",
    second: EVERY_FIVE_MINUTES,
  },
  making: { first: "Making a code…", second: EVERY_FIVE_MINUTES },
  refreshing: { first: "Making a new code…", second: EVERY_FIVE_MINUTES },
  slow: {
    first: "Still making a code…",
    second: "This can take a moment on a slow connection.",
  },
  failed: {
    first: "Couldn’t make a code.",
    second: "Check your internet connection, then get a new code.",
  },
  offline: {
    first: "You’re offline.",
    second: "A code will appear when this Mac is back online.",
  },
  expired: {
    first: "This code expired.",
    second: "Ahoy couldn’t make a new one. Check your internet connection.",
  },
  scanned: { first: "Scanned", second: "Finish pairing on your iPhone." },
};

export const failedSecondLine: Record<PairingFailure, string> = {
  network: captionCopy.failed.second,
  server: captionCopy.failed.second,
  updateRequired: "Update Ahoy on this Mac to pair a phone.",
  proofRejected:
    "That pairing did not check out, so this Mac refused it. Get a new code.",
};

export const frameLabelCopy: Record<FrameLabel, string> = {
  ready: "Pairing code for the Ahoy phone app",
  making: "Making a pairing code",
  none: "No pairing code",
  scanned: "Pairing code scanned",
};

export const pairingCodeCopy = {
  newCode: "Get a new code",
  newCodeIn: (clock: string) => `New code in ${clock}`,
};
