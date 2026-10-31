import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

const rowVariants = cva(
  "flex items-center gap-2.5 rounded-thumb py-2.5 pr-2.5 pl-3 text-ui",
  {
    variants: {
      tone: {
        note: "bg-material-tint text-driftwood",
        problem: "bg-material-problem text-ink",
      },
    },
    defaultVariants: { tone: "note" },
  },
);

type NoticeRowProps = VariantProps<typeof rowVariants> & {
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export function NoticeRow({ tone, icon, action, children }: NoticeRowProps) {
  const marker =
    tone === "problem" ? (
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-pill bg-flare"
      />
    ) : (
      icon
    );
  return (
    <div
      role={tone === "problem" ? "alert" : "status"}
      className={rowVariants({ tone })}
    >
      {marker}
      <span className="flex-1">{children}</span>
      {action}
    </div>
  );
}
