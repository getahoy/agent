import { agentCopy } from "../../copy/agentCopy.ts";
import { ListenToggle } from "../listen/listenToggle.tsx";
import { OffDurationChoices } from "../listen/offDurationChoices.tsx";
import { useListenSwitch } from "../listen/useListenSwitch.ts";

type PopoverHeaderProps = { lanEnabled: boolean };

export function PopoverHeader({ lanEnabled }: PopoverHeaderProps) {
  const listen = useListenSwitch(lanEnabled);
  return (
    <header className="flex flex-col gap-2 py-0.5 pr-1 pl-1.5">
      <div className="flex items-center justify-between">
        <span className="font-display text-card-title lowercase">
          {agentCopy["app.name"]}
        </span>
        <span className="flex items-center gap-2 text-ui">
          <span aria-hidden="true">{agentCopy["menubar.enabled"]}</span>
          <ListenToggle listen={listen} />
        </span>
      </div>
      <OffDurationChoices listen={listen} />
    </header>
  );
}
