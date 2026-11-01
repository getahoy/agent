import type { AgentState } from "../../core/appState/appState.ts";
import {
  type EndedByPhone,
  noticeShown,
} from "../../core/pairing/endedByPhone.ts";

export function shownEndedNotice(state: AgentState): EndedByPhone | null {
  const notice = state.endedNotice;
  if (!notice || state.pairedPhones.length > 0) return null;
  return noticeShown(notice, Date.now()) ? notice : null;
}
