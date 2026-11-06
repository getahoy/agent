import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { frameLabelCopy, pairingCodeCopy } from "../../copy/pairingCodeCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { PennantSpinner } from "../components/ui/pennantSpinner.tsx";
import { QrCode } from "../components/ui/qrCode.tsx";
import { QrScannedMark } from "../components/ui/qrScannedMark.tsx";
import { cn } from "../lib/cn.ts";
import type { CodeLook, FrameView } from "./codeView.ts";

const lookClass: Record<CodeLook, string> = {
  clear: "",
  blurred: "opacity-35 blur-qr",
  dim: "opacity-12",
};

type QrFrameProps = {
  view: FrameView;
  size: "window" | "setup";
  inset: "regular" | "tight";
  pending: boolean;
  onNewCode: () => void;
};

export function QrFrame({
  view,
  size,
  inset,
  pending,
  onNewCode,
}: QrFrameProps) {
  const { code } = view;
  const [codeAtOpen] = useState(code?.qr);
  return (
    <div
      role="img"
      aria-label={frameLabelCopy[view.label]}
      aria-busy={view.spinner}
      className={cn(
        "relative flex w-fit shrink-0 rounded-qr bg-qr-paper ring-1 ring-rope",
        inset === "tight" ? "p-3.5" : "p-4",
      )}
    >
      <div className={cn("relative", size === "setup" ? "size-54" : "size-42")}>
        {code ? (
          <div
            key={code.qr}
            className={cn(
              "absolute inset-0 transition-[filter,opacity] duration-240",
              lookClass[code.look],
              code.look === "clear" &&
                code.qr !== codeAtOpen &&
                "animate-qr-reveal",
            )}
          >
            <QrCode value={code.qr} />
          </div>
        ) : null}
        {view.scanned ? <QrScannedMark /> : null}
        {view.spinner ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <PennantSpinner size="qr" />
          </span>
        ) : null}
        {view.newCode ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Button
              pending={pending}
              onClick={onNewCode}
              className="h-9 animate-qr-fade gap-1.75 bg-qr-ink px-4.5 text-qr-on-ink shadow-qr-pill"
            >
              <RefreshCw
                aria-hidden="true"
                strokeWidth={1.5}
                className="size-3.5"
              />
              {pairingCodeCopy.newCode}
            </Button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
