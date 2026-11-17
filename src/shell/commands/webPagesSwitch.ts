import type { HelperClient } from "../../core/helper/helperClient.ts";
import type { AgentController } from "../agentController.ts";

// Browsers show their pages to the helper only while a phone can send commands.
export function switchWebPages(
  helper: HelperClient,
  controller: AgentController,
) {
  let sent: boolean | null = null;
  const sync = () => {
    const { lanEnabled, connectedPhoneKeys } = controller.state();
    const on = lanEnabled && connectedPhoneKeys.length > 0;
    if (on === sent) return;
    sent = on;
    void helper.request("webPages", { on });
  };
  controller.onChange(sync);
  const helperStarted = () => {
    sent = null;
    sync();
  };
  return { helperStarted };
}
