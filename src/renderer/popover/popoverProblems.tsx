import { agentCopy } from "../../copy/agentCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import type { Permission } from "../../ports/platform.ts";
import { Button } from "../components/ui/button.tsx";
import { NoticeRow } from "../components/ui/noticeRow.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";

const missingCopy: Record<Permission, string> = {
  accessibility: agentCopy["menubar.accessibilityNeeded"],
  screenRecording: agentCopy["menubar.screenRecordingNeeded"],
};

const permissionOrder: readonly Permission[] = [
  "accessibility",
  "screenRecording",
];

type PopoverProblemsProps = { state: AgentState };

export function PopoverProblems({ state }: PopoverProblemsProps) {
  const actions = useAgentActions();
  const missing = permissionOrder.filter((key) => !state.permissions[key]);
  return (
    <>
      {missing.map((permission) => (
        <NoticeRow
          key={permission}
          tone="problem"
          action={
            <Button
              size="xs"
              onClick={() => void actions.openPermissionSettings(permission)}
            >
              {agentCopy["permissions.open"]}
            </Button>
          }
        >
          {missingCopy[permission]}
        </NoticeRow>
      ))}
      {state.helper === "stopped" ? (
        <NoticeRow tone="problem">{agentCopy["helper.stopped"]}</NoticeRow>
      ) : null}
    </>
  );
}
