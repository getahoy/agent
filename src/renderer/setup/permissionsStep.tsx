import { agentCopy } from "../../copy/agentCopy.ts";
import {
  type AgentState,
  allPermissionsGranted,
} from "../../core/appState/appState.ts";
import { Button } from "../components/ui/button.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePendingAction } from "../hooks/usePendingAction.ts";
import { PermissionList } from "../permissions/permissionList.tsx";
import { PermissionsTitle } from "../permissions/permissionsTitle.tsx";
import { SetupFrame } from "./setupFrame.tsx";

type PermissionsStepProps = { permissions: AgentState["permissions"] };

export function PermissionsStep({ permissions }: PermissionsStepProps) {
  const actions = useAgentActions();
  const [next, moving] = usePendingAction(() =>
    actions.completeStep("permissions"),
  );
  return (
    <SetupFrame step={1}>
      <PermissionsTitle variant="setup" />
      <PermissionList permissions={permissions} layout="setup" />
      <Button
        size="lg"
        disabled={!allPermissionsGranted(permissions)}
        pending={moving}
        onClick={next}
      >
        {agentCopy["permissions.continue"]}
      </Button>
    </SetupFrame>
  );
}
