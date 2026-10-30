import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

const cardVariants = cva("flex flex-col", {
  variants: {
    surface: {
      window: "gap-3 rounded-group bg-paper p-4",
      glass: "gap-3 rounded-thumb bg-material-card p-3",
    },
  },
  defaultVariants: { surface: "window" },
});

type CardProps = VariantProps<typeof cardVariants> & {
  className?: string;
  children: ReactNode;
};

export function Card({ surface, className, children }: CardProps) {
  return (
    <section className={cn(cardVariants({ surface, className }))}>
      {children}
    </section>
  );
}
