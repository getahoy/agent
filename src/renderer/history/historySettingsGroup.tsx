import { useState } from "react";
import { historyCopy } from "../../copy/historyCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { ListGroup } from "../components/ui/listGroup.tsx";
import { ListRow } from "../components/ui/listRow.tsx";
import { Switch } from "../components/ui/switch.tsx";
import { ClearHistoryDialog } from "./clearHistoryDialog.tsx";
import { useClearHistory } from "./useClearHistory.ts";
import { useHistorySettings } from "./useHistorySettings.ts";

type Outcome = "kept" | "cleared" | "failed" | "changeFailed";

const notes: Record<Outcome, string> = {
  kept: historyCopy.keepHistoryDetail,
  cleared: historyCopy.clearedTitle,
  failed: historyCopy.couldNotClear,
  changeFailed: historyCopy.couldNotChange,
};

export function HistorySettingsGroup() {
  const { keepHistory, changing, change } = useHistorySettings();
  const { clear, clearing } = useClearHistory();
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>("kept");
  const confirm = async () => {
    setOutcome((await clear()) ? "cleared" : "failed");
    setConfirming(false);
  };
  const turn = async (on: boolean) => {
    setOutcome((await change(on)) ? "kept" : "changeFailed");
  };
  const toggle = (
    <Switch
      checked={keepHistory ?? true}
      disabled={changing || keepHistory === null}
      onCheckedChange={(on) => void turn(on)}
      aria-label={historyCopy.keepHistory}
    />
  );
  const clearButton = (
    <Button
      variant="quietDestructive"
      size="sm"
      disabled={keepHistory === false}
      onClick={() => setConfirming(true)}
    >
      {historyCopy.clearHistory}
    </Button>
  );
  return (
    <>
      <ListGroup label={historyCopy.title}>
        <ListRow
          title={historyCopy.keepHistory}
          detail={notes[outcome]}
          trailing={toggle}
        />
        <ListRow title={historyCopy.title} trailing={clearButton} />
      </ListGroup>
      <ClearHistoryDialog
        open={confirming}
        pending={clearing}
        onConfirm={() => void confirm()}
        onOpenChange={setConfirming}
      />
    </>
  );
}
