import { agentCopy } from "../../copy/agentCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { Card } from "../components/ui/card.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";

export function PopoverPairCard() {
  const actions = useAgentActions();
  return (
    <Card surface="glass" className="gap-3.5 px-4 py-4.5">
      <p className="font-medium text-ui">{agentCopy["popover.pairTitle"]}</p>
      <Button size="xl" width="full" onClick={() => void actions.openWindow()}>
        {agentCopy["popover.showQr"]}
      </Button>
    </Card>
  );
}
