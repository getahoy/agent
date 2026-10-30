import { agentCopy } from "../../copy/agentCopy.ts";
import { NoticeRow } from "../components/ui/noticeRow.tsx";
import { QrFrame } from "../components/ui/qrFrame.tsx";
import { PairingCountdown } from "./pairingCountdown.tsx";

type PairingOfferProps = {
  qr: string;
  expiresAt: number;
  reachableOnLan: boolean;
};

export function PairingOffer({
  qr,
  expiresAt,
  reachableOnLan,
}: PairingOfferProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <QrFrame value={qr} label={agentCopy["pair.qrLabel"]} />
      <p className="font-medium text-row">{agentCopy["pair.scan"]}</p>
      <PairingCountdown expiresAt={expiresAt} />
      {reachableOnLan ? null : (
        <NoticeRow>{agentCopy["pair.notOnLan"]}</NoticeRow>
      )}
    </div>
  );
}
