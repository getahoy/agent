import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn(
        "animate-skeleton rounded-tag bg-linen motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
