import { agentCopy } from "../../copy/agentCopy.ts";
import type { PhoneSummary } from "../../core/appState/appState.ts";

type PairedPhoneListProps = { phones: PhoneSummary[] };

export function PairedPhoneList({ phones }: PairedPhoneListProps) {
  if (phones.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 border-border border-t pt-4">
      <h2 className="font-medium text-sm">{agentCopy["pair.pairedPhones"]}</h2>
      <ul className="flex flex-col gap-1">
        {phones.map((phone) => (
          <li
            key={`${phone.displayName}-${phone.accountEmail}`}
            className="text-sm"
          >
            {phone.displayName}
            <span className="text-muted"> · {phone.accountEmail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
