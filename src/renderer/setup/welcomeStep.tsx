import { agentCopy } from "../../copy/agentCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { PennantMark } from "../components/ui/pennantMark.tsx";
import { Text } from "../components/ui/text.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePendingAction } from "../hooks/usePendingAction.ts";
import { SetupFrame } from "./setupFrame.tsx";

export function WelcomeStep() {
  const actions = useAgentActions();
  const [start, starting] = usePendingAction(() =>
    actions.completeStep("welcome"),
  );
  return (
    <SetupFrame step={0}>
      <PennantMark className="h-8.5 w-11" />
      <Text as="h1" variant="display">
        {agentCopy["welcome.title"]}{" "}
        <em>{agentCopy["welcome.titleEmphasis"]}</em>
      </Text>
      <Text variant="body" className="max-w-95">
        {agentCopy["welcome.body"]}
      </Text>
      <Button size="lg" className="mt-2" pending={starting} onClick={start}>
        {agentCopy["welcome.continue"]}
      </Button>
    </SetupFrame>
  );
}
