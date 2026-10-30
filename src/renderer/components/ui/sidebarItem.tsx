import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

type SidebarItemProps = {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onSelect: () => void;
};

export function SidebarItem({
  label,
  icon: Icon,
  active,
  onSelect,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-7.5 cursor-default items-center gap-2.5 rounded-tag px-2.5 font-medium text-ui hover:bg-hover",
        active && "bg-rope hover:bg-rope",
      )}
    >
      <Icon aria-hidden="true" strokeWidth={1.5} className="size-4" />
      {label}
    </button>
  );
}
