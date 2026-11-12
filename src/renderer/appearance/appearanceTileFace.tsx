import type { ResolvedTheme } from "@getahoy/lib";
import { cn } from "../lib/cn.ts";

const schemes: Record<ResolvedTheme, string> = {
  light: "scheme-light",
  dark: "scheme-dark",
};

type AppearanceTileFaceProps = { scheme: ResolvedTheme };

export function AppearanceTileFace({ scheme }: AppearanceTileFaceProps) {
  return (
    <span
      aria-hidden
      className={cn("absolute inset-0 bg-sailcloth", schemes[scheme])}
    >
      <span className="absolute inset-y-0 left-0 w-7.5 bg-linen" />
      <span className="absolute top-1.5 left-1.25 flex gap-0.5">
        <span className="size-1 rounded-pill bg-traffic-close" />
        <span className="size-1 rounded-pill bg-traffic-minimize" />
        <span className="size-1 rounded-pill bg-traffic-zoom" />
      </span>
      <span className="absolute top-4.5 left-1.5 h-0.75 w-4.5 rounded-pill bg-ink/35" />
      <span className="absolute top-6.25 left-1.5 h-0.75 w-3.5 rounded-pill bg-ink/35" />
      <span className="absolute top-3 left-9.5 h-1.25 w-8.5 rounded-pill bg-ink/80" />
      <span className="absolute top-6.5 right-2 left-9.5 h-5 rounded-row bg-paper" />
      <span className="absolute top-13 right-7.5 left-9.5 h-1 rounded-pill bg-ink/30" />
    </span>
  );
}
