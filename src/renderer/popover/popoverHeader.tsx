import { agentCopy } from "../../copy/agentCopy.ts";
import { Switch } from "../components/ui/switch.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";

type PopoverHeaderProps = { lanEnabled: boolean };

export function PopoverHeader({ lanEnabled }: PopoverHeaderProps) {
  const actions = useAgentActions();
  return (
    <header className="flex items-center justify-between py-0.5 pr-1 pl-1.5">
      <span className="font-display text-card-title lowercase">
        {agentCopy["app.name"]}
      </span>
      <span className="flex items-center gap-2 text-ui">
        <span aria-hidden="true">{agentCopy["menubar.enabled"]}</span>
        <Switch
          aria-label={agentCopy["menubar.enabled"]}
          checked={lanEnabled}
          onCheckedChange={(enabled) => void actions.setLanEnabled(enabled)}
        />
      </span>
    </header>
  );
}
