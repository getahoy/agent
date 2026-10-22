import { useEffect, useState } from "react";
import type { AgentState } from "../../core/appState/appState.ts";

export function useAgentState(): AgentState | null {
  const [state, setState] = useState<AgentState | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const unsubscribe = window.ahoy.onState(setState);
    window.ahoy
      .getState()
      .then(setState)
      .catch(() => setFailed(true));
    return unsubscribe;
  }, []);

  if (failed) throw new Error("The agent state could not be read");
  return state;
}
