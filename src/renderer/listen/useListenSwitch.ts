import { useState } from "react";
import type { OffDuration } from "../../core/appState/listenOff.ts";
import { useAgentActions } from "../hooks/useAgentActions.ts";

export type ListenSwitchControl = ReturnType<typeof useListenSwitch>;

export function useListenSwitch(lanEnabled: boolean) {
  const actions = useAgentActions();
  const [choosing, setChoosing] = useState(false);
  const [pending, setPending] = useState(false);
  const run = (action: () => Promise<void>) => {
    setChoosing(false);
    setPending(true);
    void action().finally(() => setPending(false));
  };
  const onCheckedChange = (checked: boolean) => {
    if (!checked) return setChoosing(true);
    if (choosing) return setChoosing(false);
    run(actions.turnOn);
  };
  return {
    checked: lanEnabled && !choosing,
    choosing,
    pending,
    onCheckedChange,
    choose: (duration: OffDuration) => run(() => actions.turnOff(duration)),
    cancel: () => setChoosing(false),
  };
}
