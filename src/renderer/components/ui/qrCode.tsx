import qrcode from "qrcode-generator";
import { useMemo } from "react";

const MARK_MODULES = 9;
const MARK_RADIUS = 2;
const PENNANT = "M1.75 1.75H20.25L13.75 9L20.25 16.25H1.75Z";
const PENNANT_INSET = { x: 1.6, y: 2.2 };
const PENNANT_SCALE = 0.264;
const PENNANT_STROKE = 3.5;

// qrcode-generator keeps only the low byte of each UTF-16 unit, so the text
// goes in as UTF-8 bytes or a Mac name like "Maya’s MacBook" would not scan.
function utf8Bytes(text: string): string {
  return String.fromCharCode(...new TextEncoder().encode(text));
}

function encode(text: string) {
  const code = qrcode(0, "H");
  code.addData(utf8Bytes(text), "Byte");
  code.make();
  const count = code.getModuleCount();
  const modules: string[] = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (code.isDark(row, col)) modules.push(`M${col} ${row}h1v1h-1z`);
    }
  }
  return { count, path: modules.join("") };
}

type QrCodeProps = { value: string };

export function QrCode({ value }: QrCodeProps) {
  const { count, path } = useMemo(() => encode(value), [value]);
  const mark = (count - MARK_MODULES) / 2;
  const pennantAt = `translate(${mark + PENNANT_INSET.x} ${mark + PENNANT_INSET.y})`;
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${count} ${count}`}
      shapeRendering="crispEdges"
      className="block size-full"
    >
      <path d={path} className="fill-qr-ink" />
      <rect
        x={mark}
        y={mark}
        width={MARK_MODULES}
        height={MARK_MODULES}
        rx={MARK_RADIUS}
        shapeRendering="geometricPrecision"
        className="fill-qr-paper"
      />
      <path
        d={PENNANT}
        transform={`${pennantAt} scale(${PENNANT_SCALE})`}
        strokeWidth={PENNANT_STROKE}
        strokeLinejoin="round"
        shapeRendering="geometricPrecision"
        className="fill-qr-ink stroke-qr-ink"
      />
    </svg>
  );
}
