import { agentCopy } from "../../copy/agentCopy.ts";
import { ListGroup } from "../components/ui/listGroup.tsx";
import { ListRow } from "../components/ui/listRow.tsx";
import { Switch } from "../components/ui/switch.tsx";
import { Text } from "../components/ui/text.tsx";
import { useAgentActions } from "../hooks/useAgentActions.ts";

type SettingsPageProps = { lanEnabled: boolean };

export function SettingsPage({ lanEnabled }: SettingsPageProps) {
  const actions = useAgentActions();
  return (
    <>
      <Text as="h1" variant="title">
        {agentCopy["nav.settings"]}
      </Text>
      <ListGroup label={agentCopy["nav.settings"]}>
        <ListRow
          title={agentCopy["menubar.enabled"]}
          trailing={
            <Switch
              aria-label={agentCopy["menubar.enabled"]}
              checked={lanEnabled}
              onCheckedChange={(enabled) => void actions.setLanEnabled(enabled)}
            />
          }
        />
      </ListGroup>
    </>
  );
}
