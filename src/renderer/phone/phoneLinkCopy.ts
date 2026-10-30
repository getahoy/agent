import { agentCopy } from "../../copy/agentCopy.ts";
import { homeCopy } from "../../copy/homeCopy.ts";
import type { EndedNotice } from "../../core/appState/appState.ts";
import type { PhoneLinkKind } from "./phoneLink.ts";

export function endedNoticeText(notice: EndedNotice): string {
  return notice.reason === "removed"
    ? homeCopy.removedBanner(notice.phoneName)
    : homeCopy.signedOutBanner(notice.phoneName);
}

export const pillLabels: Record<PhoneLinkKind, string> = {
  connected: homeCopy.connected,
  notConnected: agentCopy["status.notConnected"],
  paused: agentCopy["status.paused"],
  locked: agentCopy["status.paused"],
  off: agentCopy["status.off"],
};

export function popoverLine(kind: PhoneLinkKind, phone: string): string {
  switch (kind) {
    case "connected":
      return agentCopy["status.encrypted"];
    case "notConnected":
      return `${phone} ${agentCopy["menubar.ready"]}`;
    case "paused":
      return `${phone} ${agentCopy["menubar.paused"]}`;
    case "locked":
      return agentCopy["menubar.locked"];
    case "off":
      return agentCopy["menubar.off"];
    default: {
      const unhandled: never = kind;
      return unhandled;
    }
  }
}

export function homeLine(kind: PhoneLinkKind, phone: string): string {
  switch (kind) {
    case "connected":
      return agentCopy["status.encrypted"];
    case "notConnected":
      return homeCopy.ready(phone);
    case "paused":
      return homeCopy.paused(phone);
    case "locked":
      return agentCopy["menubar.locked"];
    case "off":
      return homeCopy.off;
    default: {
      const unhandled: never = kind;
      return unhandled;
    }
  }
}
