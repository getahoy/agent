import type { FailureReason, HistoryStatus } from "@getahoy/protocol";

export const historyCopy = {
  title: "History",
  summary: (lastSevenDays: number, didntGoThrough: number) =>
    didntGoThrough > 0
      ? `${lastSevenDays} in the last 7 days · ${didntGoThrough} didn’t go through`
      : `${lastSevenDays} in the last 7 days`,
  searchPlaceholder: "Search what you said",
  searchLabel: "Search history",
  clearSearch: "Clear search",
  filterLabel: "Filter",
  filters: { all: "All", done: "Done", failed: "Failed" },
  today: "Today",
  yesterday: "Yesterday",
  working: "Working on this Mac…",
  couldNotRefresh: "Couldn’t refresh",
  emptyTitle: "Nothing here yet.",
  emptyBody:
    "Everything you ask this Mac to do, and what it did, will be kept here.",
  errorTitle: "Couldn’t load your history.",
  errorBody: "Your entries are safe. Check your connection and try again.",
  signedOutBody: "Sign in on the Mac to see its history.",
  tryAgain: "Try again",
  clearedEyebrow: "Just now",
  clearedTitle: "History cleared.",
  clearedBody: "New commands will show up here.",
  noMatchTitle: (query: string) => `Nothing matches “${query}”.`,
  noMatchBody: "Search looks at what you said and what Ahoy did.",
  nothingFailedTitle: "Nothing failed.",
  nothingFailedBody: "Every command went through.",
  offTitle: "History is off.",
  offBody: "Turn on Keep history in Settings to start again.",
  chooseEntry: "Choose an entry to see what happened.",
  keepHistory: "Keep history",
  keepHistoryDetail:
    "What you said and what Ahoy did, kept in your account for 90 days.",
  clearHistory: "Clear history…",
  clearTitle: "Clear all history?",
  clearBody:
    "This deletes every entry, on your iPhone and on your Macs. It can’t be undone.",
  clearConfirm: "Clear history",
  cancel: "Cancel",
  couldNotClear: "Couldn’t clear your history. Try again.",
  status: {
    running: "Running",
    done: "Done",
    choice: "Asked you, then done",
    failed: "Didn’t work",
    blocked: "Blocked",
    cancelled: "Cancelled",
  } satisfies Record<HistoryStatus, string>,
  ahoyAsked: "Ahoy asked",
  youSaid: (seconds: string | null) =>
    seconds ? `You said · after ${seconds}s` : "You said",
  where: (app: string | null, seconds: string | null) =>
    [app ? `In ${app}` : null, seconds ? `${seconds}s` : null]
      .filter((part) => part !== null)
      .join(" · "),
  whyFailed: "Why it didn’t work",
  whyBlocked: "Why Ahoy stopped",
  whyCancelled: "What happened",
  timeWent: "Where the time went",
  hearing: "Hearing you",
  understanding: "Understanding",
  onMac: "On the Mac",
  waitedNote: (seconds: string) =>
    `The ${seconds}s Ahoy waited for your answer isn’t counted.`,
  understoodBy: "Understood by",
  viaAi: "Smart (AI)",
  viaAiNote: "Your words were sent to Ahoy’s AI to work out what you meant.",
  viaRules: "Built-in rules",
  viaRulesNote: "Matched one of Ahoy’s rules on this Mac. No AI was needed.",
  runAgain: "Run again on this Mac",
  runningAgain: "Running…",
  couldNotRun: "Couldn’t run that again.",
  confirmRunTitle: "Run this again?",
  confirmRunBody: (heard: string) =>
    `“${heard}” can close an app or open an email draft.`,
  confirmRun: "Run again",
  report: "Report a problem",
  reportBody: "This is exactly what will be sent. Nothing else is attached.",
  reportNote: "Add a note (optional)",
  reportSend: "Send report",
  reportSent: "Thanks. We’ll look at this one.",
  couldNotReport: "Couldn’t send the report. Try again.",
  reportFields: {
    heard: "What you said",
    did: "What Ahoy did",
    status: "Status",
    app: "App",
    reason: "Reason",
    timings: "Timings",
  },
  copy: "Copy",
  copied: "Copied",
  delete: "Delete",
  deleted: "Deleted",
  undo: "Undo",
  couldNotDelete: "Couldn’t delete that entry. Try again.",
  copiedText: (heard: string, did: string | null) =>
    did ? `“${heard}” → ${did}` : `“${heard}”`,
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
  cancelledWhy:
    "Ahoy asked you something and the question closed before an answer, so nothing was changed.",
} as const;
