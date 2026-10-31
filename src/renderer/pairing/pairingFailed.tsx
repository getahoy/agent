import { agentCopy } from "../../copy/agentCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { NoticeRow } from "../components/ui/noticeRow.tsx";

type PairingFailedProps = { message: string; onRetry: () => void };

export function PairingFailed({ message, onRetry }: PairingFailedProps) {
  return (
    <div className="w-full text-left">
      <NoticeRow
        tone="problem"
        action={
          <Button size="xs" onClick={onRetry}>
            {agentCopy["pair.retry"]}
          </Button>
        }
      >
        {message}
      </NoticeRow>
    </div>
  );
}
