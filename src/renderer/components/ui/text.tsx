import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

const textVariants = cva("", {
  variants: {
    variant: {
      display: "text-balance font-display font-light text-reveal",
      setup: "text-balance font-display font-light text-setup",
      title: "text-balance font-display font-normal text-title",
      body: "text-driftwood text-row",
      muted: "text-driftwood text-ui",
      eyebrow: "font-medium font-mono text-label uppercase",
      heard: "font-display font-normal text-driftwood text-heard italic",
      heardSmall: "font-display font-normal text-driftwood text-row italic",
    },
  },
});

type TextElement = "h1" | "h2" | "p" | "span";

type TextProps = {
  variant: NonNullable<VariantProps<typeof textVariants>["variant"]>;
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
