import { cn } from "../../lib/cn.ts";

const STROKE = 1.5;
const PENNANT = "M1.75 1.75H20.25L13.75 9L20.25 16.25H1.75Z";
const PENNANT_STROKE = 3.5;

// The QR frame keeps its own fixed palette, so it reads the same over any theme.
const sizes = {
  qr: {
    box: 28,
    radius: 11,
    frame: "size-7 animate-qr-spin motion-reduce:animate-qr-pulse",
    track: "stroke-qr-track",
    arc: "stroke-qr-ink",
    pennant: false,
  },
  md: {
    box: 40,
    radius: 18.5,
    frame: "size-10 animate-qr-spin motion-reduce:animate-breathe",
    track: "stroke-rope",
    arc: "stroke-ink",
    pennant: true,
  },
} as const;

type PennantSpinnerProps = { size?: keyof typeof sizes };

export function PennantSpinner({ size = "md" }: PennantSpinnerProps) {
  const { box, radius, frame, track, arc, pennant } = sizes[size];
  const centre = box / 2;
  const ring = (
    <svg aria-hidden="true" viewBox={`0 0 ${box} ${box}`} className={frame}>
      <circle
        cx={centre}
        cy={centre}
        r={radius}
        fill="none"
        strokeWidth={STROKE}
        className={track}
      />
      <path
        d={`M${centre} ${centre - radius}a${radius} ${radius} 0 0 1 ${radius} ${radius}`}
        fill="none"
        strokeWidth={STROKE}
        strokeLinecap="round"
        className={arc}
      />
    </svg>
  );
  if (!pennant) return ring;
  return (
    <span
      aria-hidden="true"
      className="relative flex size-10 items-center justify-center"
    >
      <span className="absolute inset-0 flex">{ring}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 22 18"
        className={cn("ml-px h-3 w-3.75 text-ink")}
      >
        <path
          d={PENNANT}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={PENNANT_STROKE}
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
