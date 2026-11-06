import { historyCopy } from "../../copy/historyCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { Text } from "../components/ui/text.tsx";
import type { BlankKind } from "./historyBlankKind.ts";

type BlankCopy = { eyebrow?: string; title: string; body: string };

type Shown = Exclude<BlankKind, "loading">;

function copyFor(kind: Shown, search: string): BlankCopy {
  const { errorTitle } = historyCopy;
  const blanks: Record<Shown, BlankCopy> = {
    error: { title: errorTitle, body: historyCopy.errorBody },
    signedOut: { title: errorTitle, body: historyCopy.signedOutBody },
    off: { title: historyCopy.offTitle, body: historyCopy.offBody },
    cleared: {
      eyebrow: historyCopy.clearedEyebrow,
      title: historyCopy.clearedTitle,
      body: historyCopy.clearedBody,
    },
    noMatch: {
      title: historyCopy.noMatchTitle(search.trim()),
      body: historyCopy.noMatchBody,
    },
    nothingFailed: {
      title: historyCopy.nothingFailedTitle,
      body: historyCopy.nothingFailedBody,
    },
    empty: { title: historyCopy.emptyTitle, body: historyCopy.emptyBody },
  };
  return blanks[kind];
}

type HistoryBlankProps = { kind: Shown; search: string; onRetry: () => void };

export function HistoryBlank({ kind, search, onRetry }: HistoryBlankProps) {
  const { eyebrow, title, body } = copyFor(kind, search);
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
      <Text variant="muted">{body}</Text>
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
