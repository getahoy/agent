import { historyCopy } from "../../copy/historyCopy.ts";
import { WaitingState } from "../components/ui/waitingState.tsx";

export function HistoryLoading({ busy }: { busy: boolean }) {
  return (
    <WaitingState
      busy={busy}
      message={historyCopy.loading}
      slowMessage={historyCopy.loadingSlow}
      slowHint={historyCopy.loadingSlowHint}
    />
  );
}
