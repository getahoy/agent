import { motion } from "motion/react";
import { agentCopy } from "../../copy/agentCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { useRise } from "../lib/motion.ts";

export function RelaunchHint() {
  const actions = useAgentActions();
  const rise = useRise();
  return (
    <motion.div
      className="flex items-center gap-3 rounded-group bg-linen px-4 py-3 text-left"
      {...rise}
    >
      <p className="flex-1 text-driftwood text-ui">
        {agentCopy["permissions.relaunchHint"]}
      </p>
      <Button variant="secondary" size="sm" onClick={actions.relaunch}>
        {agentCopy["permissions.relaunch"]}
      </Button>
    </motion.div>
  );
}
