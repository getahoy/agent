import { agentCopy } from "../../copy/agentCopy.ts";
import { Switch } from "../components/ui/switch.tsx";
import type { ListenSwitchControl } from "./useListenSwitch.ts";

type ListenToggleProps = { listen: ListenSwitchControl };

export function ListenToggle({ listen }: ListenToggleProps) {
  return (
    <Switch
      aria-label={agentCopy["menubar.enabled"]}
      checked={listen.checked}
      disabled={listen.pending}
      onCheckedChange={listen.onCheckedChange}
    />
  );
}
