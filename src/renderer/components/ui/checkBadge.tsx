import { cn } from "cn";
import { motion } from "motion/react";
import { usePop } from "../../lib/motion.ts";

type CheckBadgeProps = { label: string; className?: string };

export function CheckBadge({ label, className }: CheckBadgeProps) {
  const pop = usePop();
  return (
    <motion.svg
      role="img"
      aria-label={label}
      viewBox="0 0 22 22"
      className={cn("size-5.5 shrink-0 text-kelp", className)}
      {...pop}
    >
      <circle cx="11" cy="11" r="11" fill="currentColor" />
      <path
        d="M6.5 11.2l3 3 6-6.2"
        fill="none"
        className="stroke-paper"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}
