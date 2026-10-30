import type { AgentState, PhoneSummary } from "../../core/appState/appState.ts";

export type PhoneLinkKind =
  | "connected"
  | "notConnected"
  | "paused"
  | "locked"
  | "off";

export type PhoneLink =
  | { kind: "none" }
  | { kind: PhoneLinkKind; phone: PhoneSummary };

function linkKind(state: AgentState, phone: PhoneSummary): PhoneLinkKind {
  if (!state.lanEnabled) return "off";
  if (state.screenLocked) return "locked";
  if (state.connectedPhoneKeys.includes(phone.publicKey)) return "connected";
  if (state.pausedPhoneKeys.includes(phone.publicKey)) return "paused";
  return "notConnected";
}

export function phoneLink(state: AgentState): PhoneLink {
  const [phone] = state.pairedPhones;
  if (!phone) return { kind: "none" };
  return { kind: linkKind(state, phone), phone };
}
