import { QRCode } from "react-qrcode-logo";
import { agentCopy } from "../../copy/agentCopy.ts";

const QR_SIZE_PX = 216;
const QR_QUIET_ZONE_PX = 16;
const QR_EYE_RADIUS_PX = 10;

function tokenColor(token: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
}

type PairingQrCodeProps = {
  qr: string;
  reachableOnLan: boolean;
};

export function PairingQrCode({ qr, reachableOnLan }: PairingQrCodeProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="img"
        aria-label={agentCopy["pair.qrLabel"]}
        className="overflow-hidden rounded-control"
      >
        <QRCode
          value={qr}
          size={QR_SIZE_PX}
          quietZone={QR_QUIET_ZONE_PX}
          ecLevel="M"
          qrStyle="dots"
          eyeRadius={QR_EYE_RADIUS_PX}
          fgColor={tokenColor("--qr-foreground")}
          bgColor={tokenColor("--qr-background")}
          eyeColor={tokenColor("--qr-eye")}
        />
      </div>
      <p className="text-center text-sm">{agentCopy["pair.instructions"]}</p>
      {reachableOnLan ? null : (
        <p className="text-center text-muted text-sm">
          {agentCopy["pair.notOnLan"]}
        </p>
      )}
    </div>
  );
}
