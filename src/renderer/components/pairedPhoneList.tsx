import { agentCopy } from "../../copy/agentCopy.ts";
import type { PhoneSummary } from "../../core/appState/appState.ts";

type PairedPhoneListProps = {
  phones: PhoneSummary[];
  onRemove: (publicKey: string) => void;
};

export function PairedPhoneList({ phones, onRemove }: PairedPhoneListProps) {
  if (phones.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 border-border border-t pt-4">
      <h2 className="font-medium text-sm">{agentCopy["pair.pairedPhones"]}</h2>
      <ul className="flex flex-col gap-1">
        {phones.map((phone) => (
          <li
            key={phone.publicKey}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span>
              {phone.displayName}
              <span className="text-muted"> · {phone.accountEmail}</span>
            </span>
            <button
              type="button"
              aria-label={`${agentCopy["remove.title"]} ${phone.displayName}`}
              onClick={() => onRemove(phone.publicKey)}
              className="rounded-control px-2 py-1 text-destructive"
            >
              {agentCopy["remove.confirm"]}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
