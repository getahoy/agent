import { agentCopy } from "../../copy/agentCopy.ts";
import type { AgentState } from "../../core/appState/appState.ts";
import { Button } from "../components/ui/button.tsx";
import { NoticeRow } from "../components/ui/noticeRow.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";

type PopoverProblemsProps = { state: AgentState };

export function PopoverProblems({ state }: PopoverProblemsProps) {
  const actions = useAgentActions();
  return (
    <>
      {state.permissions.accessibility ? null : (
        <NoticeRow
          tone="problem"
          action={
            <Button
              size="xs"
              onClick={() =>
                void actions.openPermissionSettings("accessibility")
              }
            >
              {agentCopy["permissions.open"]}
            </Button>
          }
        >
          {agentCopy["menubar.accessibilityNeeded"]}
        </NoticeRow>
      )}
      {state.helper === "stopped" ? (
        <NoticeRow tone="problem">{agentCopy["helper.stopped"]}</NoticeRow>
      ) : null}
    </>
  );
}
