import type { ReactNode } from "react";

type ActionButtonProps = {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "plain";
};

const toneClasses: Record<NonNullable<ActionButtonProps["tone"]>, string> = {
  primary: "bg-primary text-primary-foreground",
  plain: "border border-border text-foreground",
};

export function ActionButton({
  children,
  onPress,
  disabled = false,
  tone = "primary",
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`rounded-control px-4 py-2 text-sm disabled:opacity-50 ${toneClasses[tone]}`}
    >
      {children}
    </button>
  );
}
