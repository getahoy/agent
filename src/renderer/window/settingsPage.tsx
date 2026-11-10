import { agentCopy } from "../../copy/agentCopy.ts";
import { AppearanceGroup } from "../appearance/appearanceGroup.tsx";
import { ListGroup } from "../components/ui/listGroup.tsx";
import { ListRow } from "../components/ui/listRow.tsx";
import { Text } from "../components/ui/text.tsx";
import { HistorySettingsGroup } from "../history/historySettingsGroup.tsx";
import { ListenToggle } from "../listen/listenToggle.tsx";
import { OffDurationChoices } from "../listen/offDurationChoices.tsx";
import { useListenSwitch } from "../listen/useListenSwitch.ts";

type SettingsPageProps = { lanEnabled: boolean };

export function SettingsPage({ lanEnabled }: SettingsPageProps) {
  const listen = useListenSwitch(lanEnabled);
  return (
    <>
      <Text as="h1" variant="title">
        {agentCopy["nav.settings"]}
      </Text>
      <ListGroup label={agentCopy["nav.settings"]}>
        <ListRow
          title={agentCopy["menubar.enabled"]}
          trailing={<ListenToggle listen={listen} />}
        />
      </ListGroup>
      <OffDurationChoices listen={listen} />
      <AppearanceGroup />
      <HistorySettingsGroup />
    </>
  );
}
