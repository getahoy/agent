import { agentCopy } from "../../copy/agentCopy.ts";
import { homeCopy } from "../../copy/homeCopy.ts";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { PopoverMenuRow } from "./popoverMenuRow.tsx";

type PopoverFooterProps = { hasPhone: boolean };

export function PopoverFooter({ hasPhone }: PopoverFooterProps) {
  const actions = useAgentActions();
  const pairNewPhone = async () => {
    await actions.requestNewPhone();
    await actions.openWindow();
  };
  return (
    <nav className="flex flex-col border-hairline border-t pt-1.5">
      <PopoverMenuRow
        label={agentCopy["menubar.open"]}
        onSelect={() => void actions.openWindow()}
      />
      {hasPhone ? (
        <PopoverMenuRow
          label={homeCopy.pairNew}
          onSelect={() => void pairNewPhone()}
        />
      ) : null}
      <PopoverMenuRow
        label={agentCopy["menubar.quit"]}
        shortcut={agentCopy["menubar.quitShortcut"]}
        onSelect={() => void actions.quit()}
      />
    </nav>
  );
}
