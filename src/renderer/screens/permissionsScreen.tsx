import { agentCopy } from "../../copy/agentCopy.ts";
import {
  type AgentState,
  allPermissionsGranted,
} from "../../core/appState/appState.ts";
import { ActionButton } from "../components/actionButton.tsx";
import { PermissionRow } from "../components/permissionRow.tsx";
import { ScreenLayout } from "../components/screenLayout.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";

type PermissionsScreenProps = { state: AgentState };

export function PermissionsScreen({ state }: PermissionsScreenProps) {
  const actions = useAgentActions();
  const { permissions } = state;

  return (
    <ScreenLayout title={agentCopy["permissions.title"]} helper={state.helper}>
      <PermissionRow
        name={agentCopy["permissions.accessibility.name"]}
        purpose={agentCopy["permissions.accessibility.purpose"]}
        granted={permissions.accessibility}
        onOpenSettings={() =>
          void actions.openPermissionSettings("accessibility")
        }
      />
      <PermissionRow
        name={agentCopy["permissions.screenRecording.name"]}
        purpose={agentCopy["permissions.screenRecording.purpose"]}
        granted={permissions.screenRecording}
        onOpenSettings={() =>
          void actions.openPermissionSettings("screenRecording")
        }
      />
      {permissions.screenRecording ? null : (
        <div className="flex items-center gap-4">
          <p className="flex-1 text-muted text-sm">
            {agentCopy["permissions.relaunchHint"]}
          </p>
          <ActionButton tone="plain" onPress={() => void actions.relaunch()}>
            {agentCopy["permissions.relaunch"]}
          </ActionButton>
        </div>
      )}
      <div>
        <ActionButton
          disabled={!allPermissionsGranted(permissions)}
          onPress={() => void actions.completeStep("permissions")}
        >
          {agentCopy["permissions.continue"]}
        </ActionButton>
      </div>
    </ScreenLayout>
  );
}
