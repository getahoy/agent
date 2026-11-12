import { blankCopy, type ShownBlank } from "@getahoy/lib";
import { historyCopy } from "../../copy/historyCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { Text } from "../components/ui/text.tsx";

type HistoryBlankProps = {
  kind: ShownBlank;
  search: string;
  onRetry: () => void;
};

export function HistoryBlank({ kind, search, onRetry }: HistoryBlankProps) {
  const { eyebrow, title, body } = blankCopy(kind, search, historyCopy);
  return (
    <div role="status" className="flex flex-col gap-2 px-3 pt-10">
      {eyebrow ? (
        <Text variant="eyebrow" className="text-driftwood">
          {eyebrow}
        </Text>
      ) : null}
      <Text variant="title" className="text-card-title">
        {title}
      </Text>
      {body ? <Text variant="muted">{body}</Text> : null}
      {kind === "error" ? (
        <Button
          variant="secondary"
          size="sm"
          className="mt-1 self-start"
          onClick={onRetry}
        >
          {historyCopy.tryAgain}
        </Button>
      ) : null}
    </div>
  );
}
