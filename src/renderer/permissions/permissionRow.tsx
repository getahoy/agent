import { cn } from "cn";
import { agentCopy } from "../../copy/agentCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { CheckBadge } from "../components/ui/checkBadge.tsx";
import { ListRow } from "../components/ui/listRow.tsx";

type PermissionRowProps = {
  name: string;
  purpose: string;
  granted: boolean;
  layout: "page" | "setup";
  onOpenSettings: () => void;
};

export function PermissionRow({
  name,
  purpose,
  granted,
  layout,
  onOpenSettings,
}: PermissionRowProps) {
  const statusClass = cn(layout === "setup" && "sr-only");
  const trailing = granted ? (
    <span className="flex items-center gap-1.5 font-medium text-kelp text-ui">
      <CheckBadge label={agentCopy["permissions.granted"]} />
      <span className={statusClass}>{agentCopy["permissions.granted"]}</span>
    </span>
  ) : (
    <span className="flex items-center gap-2.5">
      <span className={cn("text-caption text-driftwood", statusClass)}>
        {agentCopy["permissions.needed"]}
      </span>
      <Button size="sm" onClick={onOpenSettings}>
        {agentCopy["permissions.open"]}
      </Button>
    </span>
  );
  return <ListRow title={name} detail={purpose} trailing={trailing} />;
}
