const RADIUS = 11;
const CENTRE = 14;
const STROKE = 1.5;

export function QrSpinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 28"
      className="size-7 animate-qr-spin motion-reduce:animate-qr-pulse"
    >
      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE}
        className="stroke-qr-track"
      />
      <path
        d={`M${CENTRE} ${CENTRE - RADIUS}a${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} ${RADIUS}`}
        fill="none"
        strokeWidth={STROKE}
        strokeLinecap="round"
        className="stroke-qr-ink"
      />
    </svg>
  );
}
