import { agentCopy } from "../../copy/agentCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import { ListGroup } from "../components/ui/listGroup.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { PermissionRow } from "./permissionRow.tsx";
import { RelaunchHint } from "./relaunchHint.tsx";

type PermissionListProps = {
  permissions: AgentState["permissions"];
  layout: "page" | "setup";
};

export function PermissionList({ permissions, layout }: PermissionListProps) {
  const actions = useAgentActions();
  return (
    <div className="flex w-full flex-col gap-3">
      <ListGroup label={agentCopy["nav.permissions"]}>
        <PermissionRow
          name={agentCopy["permissions.accessibility.name"]}
          purpose={agentCopy["permissions.accessibility.purpose"]}
          granted={permissions.accessibility}
          layout={layout}
          onOpenSettings={() =>
            void actions.openPermissionSettings("accessibility")
          }
        />
        <PermissionRow
          name={agentCopy["permissions.screenRecording.name"]}
          purpose={agentCopy["permissions.screenRecording.purpose"]}
          granted={permissions.screenRecording}
          layout={layout}
          onOpenSettings={() =>
            void actions.openPermissionSettings("screenRecording")
          }
        />
      </ListGroup>
      {permissions.screenRecording ? null : <RelaunchHint />}
    </div>
  );
}
