import { useState } from "react";
import { agentCopy } from "../../copy/agentCopy.ts";
import { homeCopy } from "../../copy/homeCopy.ts";
import type { PhoneSummary } from "../../core/appState/appState.ts";
import { Button } from "../components/ui/button.tsx";
import { ConfirmDialog } from "../components/ui/confirmDialog.tsx";
import { ListGroup } from "../components/ui/listGroup.tsx";
import { ListRow } from "../components/ui/listRow.tsx";
import { Text } from "../components/ui/text.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";
import { usePendingAction } from "../hooks/usePendingAction.ts";

type AccountPageProps = { phone: PhoneSummary | undefined };

export function AccountPage({ phone }: AccountPageProps) {
  const actions = useAgentActions();
  const [confirming, setConfirming] = useState(false);
  const [signOut, signingOut] = usePendingAction(async () => {
    await actions.signOut();
    setConfirming(false);
  });
  return (
    <>
      <Text as="h1" variant="title">
        {agentCopy["account.title"]}
      </Text>
      {phone ? (
        <ListGroup label={agentCopy["account.title"]}>
          <ListRow
            title={homeCopy.signedInAs}
            trailing={
              <span className="text-body-sm text-driftwood">
                {phone.accountEmail}
              </span>
            }
          />
        </ListGroup>
      ) : null}
      <div>
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          {homeCopy.signOut}
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title={agentCopy["signOut.title"]}
        body={
          phone
            ? homeCopy.signOutBody(phone.displayName)
            : agentCopy["signOut.body"]
        }
        confirmLabel={agentCopy["signOut.confirm"]}
        cancelLabel={agentCopy["dialog.cancel"]}
        pending={signingOut}
        onConfirm={signOut}
        onOpenChange={setConfirming}
      />
    </>
  );
}
