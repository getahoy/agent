import { captionCopy, failedSecondLine } from "../../copy/pairingCodeCopy.ts";
import { cn } from "../lib/cn.ts";
import { CodeTimer } from "./codeTimer.tsx";
import { type CodeStatus, captionKind } from "./codeView.ts";

type PairingCaptionProps = {
  status: CodeStatus;
  align: "start" | "center";
  width: "regular" | "narrow";
};

export function PairingCaption({ status, align, width }: PairingCaptionProps) {
  const lines = captionCopy[captionKind(status)];
  const second =
    status.kind === "failed" ? failedSecondLine[status.reason] : lines.second;
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-h-19.5 flex-col gap-1.5",
        align === "center"
          ? "items-center text-center"
          : "items-start text-left",
        width === "narrow" ? "max-w-65" : "max-w-90",
      )}
    >
      <p
        key={lines.first}
        className="animate-qr-rise font-medium text-row motion-reduce:animate-qr-fade"
      >
        {lines.first}
      </p>
      <p className="text-driftwood text-ui">{second}</p>
      <CodeTimer
        expiresAt={status.kind === "offering" ? status.expiresAt : null}
      />
    </div>
  );
}
