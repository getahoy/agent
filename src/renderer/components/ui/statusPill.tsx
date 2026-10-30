import { cva, type VariantProps } from "class-variance-authority";

const pillVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border border-rope font-medium text-caption",
  {
    variants: {
      tone: { live: "text-ink", quiet: "text-driftwood" },
      size: { sm: "h-5.5 px-2.25", md: "h-6.5 px-2.75" },
    },
    defaultVariants: { tone: "live", size: "md" },
  },
);

const dotVariants = cva("size-1.5 rounded-pill", {
  variants: { tone: { live: "bg-kelp", quiet: "bg-fog" } },
  defaultVariants: { tone: "live" },
});

type StatusPillProps = VariantProps<typeof pillVariants> & { label: string };

export function StatusPill({ label, tone, size }: StatusPillProps) {
  return (
    <span className={pillVariants({ tone, size })}>
      <span aria-hidden="true" className={dotVariants({ tone })} />
      {label}
    </span>
  );
}
