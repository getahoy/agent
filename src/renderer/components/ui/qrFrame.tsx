import { QRCode } from "react-qrcode-logo";

const QR_SIZE_PX = 200;
const QR_QUIET_ZONE_PX = 0;

function tokenColor(token: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
}

type QrFrameProps = { value: string; label: string };

export function QrFrame({ value, label }: QrFrameProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className="rounded-qr bg-qr-paper p-4 ring-1 ring-rope"
    >
      <QRCode
        value={value}
        size={QR_SIZE_PX}
        quietZone={QR_QUIET_ZONE_PX}
        ecLevel="M"
        qrStyle="squares"
        fgColor={tokenColor("--qr-ink")}
        bgColor={tokenColor("--qr-paper")}
      />
    </div>
  );
}
