const GRID = 29;
const CENTRE = GRID / 2;
const DISC_RADIUS = 5;
const CHECK = "M12.2 14.7l1.6 1.6 3.2-3.4";
const CHECK_STROKE = 0.7;

export function QrScannedMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${GRID} ${GRID}`}
      shapeRendering="geometricPrecision"
      className="absolute inset-0 size-full animate-qr-fade"
    >
      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={DISC_RADIUS}
        className="fill-qr-paper"
      />
      <path
        d={CHECK}
        fill="none"
        strokeWidth={CHECK_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-qr-check"
      />
    </svg>
  );
}
