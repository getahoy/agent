import { agentCopy } from "../../copy/agentCopy.ts";
import { ActionButton } from "./actionButton.tsx";

type PermissionRowProps = {
  name: string;
  purpose: string;
  granted: boolean;
  onOpenSettings: () => void;
};

export function PermissionRow({
  name,
  purpose,
  granted,
  onOpenSettings,
}: PermissionRowProps) {
  return (
    <section className="flex items-center gap-4 rounded-control border border-border p-4">
      <div className="flex flex-1 flex-col gap-1">
        <h2 className="font-medium">{name}</h2>
        <p className="text-muted text-sm">{purpose}</p>
        <p
          className={
            granted ? "text-sm text-success" : "text-destructive text-sm"
          }
        >
          {granted
            ? agentCopy["permissions.granted"]
            : agentCopy["permissions.needed"]}
        </p>
      </div>
      {granted ? null : (
        <ActionButton tone="plain" onPress={onOpenSettings}>
          {agentCopy["permissions.open"]}
        </ActionButton>
      )}
    </section>
  );
}
