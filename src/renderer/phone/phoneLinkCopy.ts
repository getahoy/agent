import { agentCopy } from "../../copy/agentCopy.ts";
import { endedWhenCopy } from "../../copy/endedCopy.ts";
import { homeCopy } from "../../copy/homeCopy.ts";
import {
  type EndedByPhone,
  noticeAge,
} from "../../core/pairing/endedByPhone.ts";
import type { PhoneLinkKind } from "./phoneLink.ts";

export function endedWhen(notice: EndedByPhone, now: number): string {
  const age = noticeAge(notice.at, now);
  const when =
    age.kind === "justNow"
      ? endedWhenCopy.justNow
      : age.kind === "minutes"
        ? endedWhenCopy.minutes(age.count)
        : endedWhenCopy.hours(age.count);
  return notice.whileAsleep ? endedWhenCopy.whileAsleep(when) : when;
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
