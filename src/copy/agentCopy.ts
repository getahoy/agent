import type { HelperStatus } from "../core/appState/appState.ts";

export const agentCopy = {
  "app.name": "Ahoy",
  loading: "Starting Ahoy…",
  "error.message": "Something went wrong. Try again.",
  "error.retry": "Try again",
  "welcome.title": "Welcome to Ahoy",
  "welcome.body":
    "Talk to your Mac from your phone. Ahoy reads what is on screen and does what you ask.",
  "welcome.continue": "Get started",
  "permissions.title": "Allow Ahoy to see and use your screen",
  "permissions.accessibility.name": "Accessibility",
  "permissions.accessibility.purpose":
    "Lets Ahoy read buttons and fields, and click and type for you.",
  "permissions.screenRecording.name": "Screen Recording",
  "permissions.screenRecording.purpose":
    "Lets Ahoy take screenshots when you ask for one.",
  "permissions.granted": "Allowed",
  "permissions.needed": "Not allowed yet",
  "permissions.open": "Open System Settings",
  "permissions.relaunchHint":
    "Just allowed Screen Recording? macOS applies it after Ahoy restarts.",
  "permissions.relaunch": "Restart Ahoy",
  "permissions.continue": "Continue",
  "pair.title": "Pair your phone",
  "pair.body":
    "No phone is paired yet. Pairing with the Ahoy phone app is not in this build.",
  "helper.starting": "Screen helper starting",
  "helper.running": "Screen helper running",
  "helper.stopped": "Screen helper stopped, restarting",
  "menubar.disconnected": "No phone connected",
  "menubar.locked": "Screen locked, Ahoy is paused",
  "menubar.accessibilityNeeded": "Accessibility not allowed",
  "menubar.screenRecordingNeeded": "Screen Recording not allowed",
  "menubar.open": "Open Ahoy",
  "menubar.quit": "Quit Ahoy",
} as const;

export const helperStatusCopy: Record<HelperStatus, string> = {
  starting: agentCopy["helper.starting"],
  running: agentCopy["helper.running"],
  stopped: agentCopy["helper.stopped"],
};
