import {
  House,
  type LucideIcon,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  UserRound,
} from "lucide-react";
import { agentCopy } from "../../copy/agentCopy.ts";
import { homeCopy } from "../../copy/homeCopy.ts";
import { SidebarItem } from "../components/ui/sidebarItem.tsx";
import type { PhoneLink } from "../phone/phoneLink.ts";
import { pillLabels } from "../phone/phoneLinkCopy.ts";
import type { WindowPage } from "./windowPage.ts";

const pages: readonly { page: WindowPage; icon: LucideIcon }[] = [
  { page: "home", icon: House },
  { page: "phone", icon: Smartphone },
  { page: "permissions", icon: ShieldCheck },
  { page: "settings", icon: SlidersHorizontal },
  { page: "account", icon: UserRound },
];

function footerLine(link: PhoneLink): string {
  if (link.kind === "none") return agentCopy["menubar.noPhone"];
  return homeCopy.phoneWithStatus(
    link.phone.displayName,
    pillLabels[link.kind],
  );
}

type SidebarProps = {
  active: WindowPage;
  link: PhoneLink;
  onSelect: (page: WindowPage) => void;
};

export function Sidebar({ active, link, onSelect }: SidebarProps) {
  const live = link.kind === "connected";
  return (
    <aside className="flex w-sidebar shrink-0 flex-col gap-0.5 border-rope border-r bg-linen px-2.5 pt-13 pb-3.5">
      <nav
        aria-label={agentCopy["nav.label"]}
        className="flex flex-col gap-0.5"
      >
        {pages.map(({ page, icon }) => (
          <SidebarItem
            key={page}
            label={agentCopy[`nav.${page}`]}
            icon={icon}
            active={page === active}
            onSelect={() => onSelect(page)}
          />
        ))}
      </nav>
      <p className="mt-auto flex items-center gap-2 overflow-hidden px-2.5 py-2 text-caption text-driftwood">
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-pill ${live ? "bg-kelp" : "bg-fog"}`}
        />
        <span className="truncate">{footerLine(link)}</span>
      </p>
    </aside>
  );
}
