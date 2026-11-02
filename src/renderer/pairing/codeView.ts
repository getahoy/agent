import type { CaptionKind, FrameLabel } from "../../copy/pairingCodeCopy.ts";
import type { PairingStatus } from "../../core/pairing/pairingStatus.ts";

export type CodeStatus = Exclude<PairingStatus, { kind: "paired" }>;

export type CodeLook = "clear" | "blurred" | "dim";

export type FrameView = {
  code: { qr: string; look: CodeLook } | null;
  spinner: boolean;
  newCode: boolean;
  scanned: boolean;
  label: FrameLabel;
};

const emptyFrame: FrameView = {
  code: null,
  spinner: false,
  newCode: false,
  scanned: false,
  label: "none",
};

export function frameView(status: CodeStatus, spinning: boolean): FrameView {
  switch (status.kind) {
    case "idle":
    case "starting":
    case "slow":
      return { ...emptyFrame, spinner: spinning, label: "making" };
    case "offering":
      return {
        ...emptyFrame,
        code: { qr: status.qr, look: "clear" },
        label: "ready",
      };
    case "refreshing":
      return {
        ...emptyFrame,
        code: { qr: status.qr, look: "blurred" },
        spinner: spinning,
        label: "making",
      };
    case "offline":
      return emptyFrame;
    case "failed":
      return { ...emptyFrame, newCode: true };
    case "expired":
      return {
        ...emptyFrame,
        code: { qr: status.qr, look: "blurred" },
        newCode: true,
      };
    case "scanned":
      return {
        ...emptyFrame,
        code: { qr: status.qr, look: "dim" },
        scanned: true,
        label: "scanned",
      };
    default: {
      const unhandled: never = status;
      return unhandled;
    }
  }
}

export function captionKind(status: CodeStatus): CaptionKind {
  switch (status.kind) {
    case "idle":
    case "starting":
      return "making";
    case "offering":
      return "ready";
    case "slow":
    case "refreshing":
    case "offline":
    case "failed":
    case "expired":
    case "scanned":
      return status.kind;
    default: {
      const unhandled: never = status;
      return unhandled;
    }
  }
}
