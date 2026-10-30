type PennantMarkProps = { className?: string };

export function PennantMark({ className }: PennantMarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 26 20"
      className={className}
      fill="currentColor"
    >
      <path
        d="M2 1.5H24L16.5 10L24 18.5H2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
