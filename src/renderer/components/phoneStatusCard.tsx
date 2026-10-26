import { homeCopy } from "../../copy/homeCopy.ts";
import type { AgentState, PhoneSummary } from "../../core/appState/appState.ts";

type PhoneStatusCardProps = { state: AgentState; phone: PhoneSummary };

const MS_PER_MINUTE = 60_000;
const relativeTime = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

function statusLine(state: AgentState, phone: PhoneSummary): string {
  if (!state.lanEnabled) return homeCopy.off;
  if (state.connectedPhoneKeys.includes(phone.publicKey)) {
    return homeCopy.connected;
  }
  if (state.pausedPhoneKeys.includes(phone.publicKey)) {
    return homeCopy.paused(phone.displayName);
  }
  return homeCopy.ready(phone.displayName);
}

function lastConnected(state: AgentState, phone: PhoneSummary): string | null {
  if (state.lastConnectedAt === null) return null;
  if (state.connectedPhoneKeys.includes(phone.publicKey)) return null;
  const elapsedMs = state.lastConnectedAt - Date.now();
  const minutes = Math.round(elapsedMs / MS_PER_MINUTE);
  return `${homeCopy.lastConnected} ${relativeTime.format(minutes, "minute")}`;
}

export function PhoneStatusCard({ state, phone }: PhoneStatusCardProps) {
  const connected = state.connectedPhoneKeys.includes(phone.publicKey);
  const since = lastConnected(state, phone);
  return (
    <section className="flex flex-col gap-2 rounded-control border border-border p-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${connected ? "bg-success" : "bg-muted"}`}
        />
        <h2 className="font-medium">{phone.displayName}</h2>
      </div>
      <p className="text-sm" aria-live="polite">
        {statusLine(state, phone)}
      </p>
      {since ? <p className="text-muted text-xs">{since}</p> : null}
    </section>
  );
}
