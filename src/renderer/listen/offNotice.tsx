import { agentCopy } from "../../copy/agentCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { NoticeRow } from "../components/ui/noticeRow.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePendingAction } from "../hooks/usePendingAction.ts";

export function OffNotice() {
  const actions = useAgentActions();
  const [turnOn, turning] = usePendingAction(actions.turnOn);
  return (
    <NoticeRow
      action={
        <Button size="sm" pending={turning} onClick={turnOn}>
          {agentCopy["listen.turnOn"]}
        </Button>
      }
    >
      {agentCopy["listen.off"]}
    </NoticeRow>
  );
}
