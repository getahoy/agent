import { motion } from "motion/react";
import { usePop } from "../../lib/motion.ts";

export function CheckBadge() {
  const pop = usePop();
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 22 22"
      className="size-5.5 shrink-0 text-kelp"
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
