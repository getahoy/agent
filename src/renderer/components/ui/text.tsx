import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type { ReactNode } from "react";

const textVariants = cva("", {
  variants: {
    variant: {
      display: "text-balance font-display font-light text-reveal",
      setup: "text-balance font-display font-light text-setup",
      title: "text-balance font-display font-normal text-title",
      cardTitle: "font-display font-normal text-card-title",
      body: "text-driftwood text-row",
      ui: "text-ui",
      muted: "text-driftwood text-ui",
      caption: "text-caption text-driftwood",
      eyebrow: "font-medium font-mono text-label uppercase",
      heard: "font-display font-normal text-driftwood text-row italic",
    },
  },
  defaultVariants: { variant: "ui" },
});

type TextElement = "h1" | "h2" | "p" | "span";

type TextProps = VariantProps<typeof textVariants> & {
  as?: TextElement;
  className?: string;
  children: ReactNode;
};

export function Text({ as = "p", variant, className, children }: TextProps) {
  const Element = as;
  return (
    <Element className={cn(textVariants({ variant, className }))}>
      {children}
    </Element>
  );
}
