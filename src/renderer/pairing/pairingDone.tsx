import { agentCopy } from "../../copy/agentCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { StatusPill } from "../components/ui/statusPill.tsx";
import { Text } from "../components/ui/text.tsx";
import { OffNotice } from "../listen/offNotice.tsx";

type PairingDoneProps = {
  phoneName: string;
  accountEmail: string;
  listening: boolean;
  pending: boolean;
  onFinish: () => void;
};

export function PairingDone({
  phoneName,
  accountEmail,
  listening,
  pending,
  onFinish,
}: PairingDoneProps) {
  return (
    <div
      aria-live="polite"
      className="flex flex-col items-center gap-5 text-center"
    >
      <StatusPill label={`${agentCopy["pair.pairedWith"]} ${phoneName}`} />
      {listening ? (
        <>
          <Text as="h1" variant="display">
            {agentCopy["pair.tryTitle"]}{" "}
            <em>{agentCopy["pair.tryTitleEmphasis"]}</em>
          </Text>
          <Text variant="body">{agentCopy["pair.tryHint"]}</Text>
        </>
      ) : (
        <OffNotice />
      )}
      <Text variant="muted">
        {agentCopy["pair.account"]}: {accountEmail}
      </Text>
      <Button variant="secondary" pending={pending} onClick={onFinish}>
        {agentCopy["pair.done"]}
      </Button>
    </div>
  );
}
