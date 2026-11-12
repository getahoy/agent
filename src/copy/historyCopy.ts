import { historyCopy as baseHistoryCopy } from "@getahoy/lib";
import type { FailureReason } from "@getahoy/protocol";

export const historyCopy = {
  ...baseHistoryCopy,
  working: "Working on this Mac…",
  refresh: "Refresh history",
  refreshHint: "Refresh (⌘R)",
  emptyBody:
    "Everything you ask this Mac to do, and what it did, will be kept here.",
  signedOutBody: "Sign in on the Mac to see its history.",
  offBody: "Turn on Keep history in Settings to start again.",
  entry: "Entry",
  closeEntry: "Close entry",
  closeEntryHint: "Close (Esc)",
  keepHistoryDetail: baseHistoryCopy.keepHistoryDisclosure(null),
  runAgain: "Run again on this Mac",
  runningAgain: "Running…",
  couldNotRun: "Couldn’t run that again.",
  viaRulesNote: "Matched one of Ahoy’s rules on this Mac. No AI was needed.",
  why: {
    macUnreachable:
      "The iPhone couldn’t reach this Mac. Check that both are on the same Wi-Fi and Ahoy is open.",
    noAnswer:
      "This Mac got the command but didn’t answer in time. Try it again in a moment.",
    nothingHeard: "Ahoy didn’t hear any words.",
    transcribeFailed: "Ahoy couldn’t turn what you said into words.",
    unknownApp:
      "Ahoy couldn’t find an app with that name on this Mac. Say the name as it appears in Applications.",
    nothingSelected:
      "Nothing was in front, so Ahoy didn’t know where to act. Open the window, then say it again.",
    targetNotFound:
      "Ahoy couldn’t find that on the screen. Say the name as it’s written, or say a number on the overlay.",
    blockedApp:
      "This app is on the list of apps Ahoy never clicks or types in. You can change the list in Ahoy’s settings file.",
    screenChanged:
      "The screen changed before Ahoy acted, so it stopped. Say it again.",
    offline: "The iPhone was offline.",
    other: "Ahoy couldn’t do this one. Try saying it a different way.",
  } satisfies Record<FailureReason, string>,
} as const;
