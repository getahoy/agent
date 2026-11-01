import { motion } from "motion/react";
import { agentCopy } from "../../copy/agentCopy.ts";
import { endedCopy } from "../../copy/endedCopy.ts";
import type { EndedByPhone } from "../../core/pairing/endedByPhone.ts";
import { Button } from "../components/ui/button.tsx";
import { Card } from "../components/ui/card.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { useMessageEnter } from "../lib/motion.ts";
import { endedWhen } from "../phone/phoneLinkCopy.ts";

type PopoverPairCardProps = { ended: EndedByPhone | null };

export function PopoverPairCard({ ended }: PopoverPairCardProps) {
  const actions = useAgentActions();
  const enter = useMessageEnter();
  const showQr = (
    <Button size="xl" width="full" onClick={() => void actions.openWindow()}>
      {agentCopy["popover.showQr"]}
    </Button>
  );
  if (!ended) {
    return (
      <Card surface="glass" className="gap-3.5 px-4 py-4.5">
        <p className="font-medium text-ui">{agentCopy["popover.pairTitle"]}</p>
        {showQr}
      </Card>
    );
  }
  const copy = endedCopy[ended.reason];
  return (
    <motion.div {...enter} role="status" aria-live="polite">
      <Card surface="glass" className="gap-3 p-4">
        <div className="flex flex-col gap-1.5">
          <p className="font-medium font-mono text-driftwood text-micro uppercase">
            {endedWhen(ended, Date.now())}
          </p>
          <p className="font-display text-card-title">{copy.title}</p>
          <p className="text-driftwood text-ui">
            {copy.popover(ended.deviceName)}
          </p>
        </div>
        {showQr}
      </Card>
    </motion.div>
  );
}
