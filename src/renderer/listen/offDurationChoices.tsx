import { agentCopy } from "../../copy/agentCopy.ts";
import type { OffDuration } from "../../core/appState/listenOff.ts";
import { Button } from "../components/ui/button.tsx";
import type { ListenSwitchControl } from "./useListenSwitch.ts";

const durations: readonly { duration: OffDuration; label: string }[] = [
  { duration: "hour", label: agentCopy["listen.hour"] },
  { duration: "tomorrow", label: agentCopy["listen.tomorrow"] },
  { duration: "untilOn", label: agentCopy["listen.untilOn"] },
];

type OffDurationChoicesProps = { listen: ListenSwitchControl };

export function OffDurationChoices({ listen }: OffDurationChoicesProps) {
  if (!listen.choosing) return null;
  return (
    <fieldset
      aria-label={agentCopy["listen.offFor"]}
      className="flex flex-wrap gap-1.5"
    >
      {durations.map(({ duration, label }) => (
        <Button
          key={duration}
          variant="secondary"
          size="xs"
          onClick={() => listen.choose(duration)}
        >
          {label}
        </Button>
      ))}
      <Button variant="ghost" size="xs" onClick={listen.cancel}>
        {agentCopy["listen.keepOn"]}
      </Button>
    </fieldset>
  );
}
