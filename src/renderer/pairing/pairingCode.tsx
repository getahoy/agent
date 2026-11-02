import { agentCopy } from "../../copy/agentCopy.ts";
import { NoticeRow } from "../components/ui/noticeRow.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePendingAction } from "../hooks/usePendingAction.ts";
import { cn } from "../lib/cn.ts";
import { type CodeStatus, frameView } from "./codeView.ts";
import { PairingCaption } from "./pairingCaption.tsx";
import { QrFrame } from "./qrFrame.tsx";
import { useShownCode } from "./useShownCode.ts";

export type PairingPlace = "home" | "ended" | "setup" | "newPhone";

type PairingCodeProps = { status: CodeStatus; place: PairingPlace };

export function PairingCode({ status, place }: PairingCodeProps) {
  const { shown, spinning } = useShownCode(status);
  const actions = useAgentActions();
  const [newCode, pending] = usePendingAction(actions.startPairing);
  const row = place === "ended";
  const centred = place === "setup" || place === "newPhone";
  const offLan = shown.kind === "offering" && !shown.reachableOnLan;
  return (
    <div className={cn("flex flex-col gap-4", centred && "items-center")}>
      <div
        className={cn(
          "flex",
          row && "flex-row items-center gap-6",
          !row && "flex-col gap-4",
          place === "setup" && "gap-4.5",
          centred && "items-center",
        )}
      >
        <QrFrame
          view={frameView(shown, spinning)}
          size={place === "setup" ? "setup" : "window"}
          inset={row ? "tight" : "regular"}
          pending={pending}
          onNewCode={newCode}
        />
        <PairingCaption
          status={shown}
          align={centred ? "center" : "start"}
          width={row ? "narrow" : "regular"}
        />
      </div>
      {offLan ? <NoticeRow>{agentCopy["pair.notOnLan"]}</NoticeRow> : null}
    </div>
  );
}
