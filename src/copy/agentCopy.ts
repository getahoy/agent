import type { HelperStatus } from "../core/appState/appState.ts";
import type { PairingFailure } from "../core/pairing/pairingStatus.ts";

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
  "pair.starting": "Getting a pairing code…",
  "pair.instructions":
    "Open Ahoy on your phone, sign in, and scan this code. A new code appears every 5 minutes.",
  "pair.qrLabel": "Pairing code for the Ahoy phone app",
  "pair.notOnLan":
    "Your phone can pair now, but it connects over Wi-Fi. Turn Ahoy on and join the same Wi-Fi as your phone.",
  "pair.retry": "Try again",
  "pair.pairedWith": "Paired with",
  "pair.account": "Account",
  "pair.done": "Done",
  "pair.newTitle": "Pair a new phone",
  "pair.cancel": "Cancel",
  "remove.title": "Remove",
  "remove.body":
    "It will stop working with this Mac right away. To use it again, scan a new code.",
  "remove.confirm": "Remove",
  "remove.cancel": "Cancel",
  "signOut.title": "Sign out of Ahoy on this Mac?",
  "signOut.bodyWithPhone":
    "will be removed and you will need to scan a new code to use Ahoy again.",
  "signOut.body": "You will need to scan a new code to use Ahoy again.",
  "signOut.confirm": "Sign out",
  "ended.removed": "removed this Mac from Ahoy.",
  "ended.signedOut": "signed out of Ahoy on this Mac.",
  "helper.starting": "Screen helper starting",
  "helper.running": "Screen helper running",
  "helper.stopped": "Screen helper stopped, restarting",
  "menubar.off": "Ahoy is off",
  "menubar.connectedTo": "Connected to",
  "menubar.ready": "is not connected",
  "menubar.paused": "paused the connection",
  "menubar.noPhone": "No phone paired",
  "menubar.locked": "Screen locked, Ahoy is paused",
  "menubar.accessibilityNeeded": "Accessibility not allowed",
  "menubar.screenRecordingNeeded": "Screen Recording not allowed",
  "menubar.enabled": "Ahoy On",
  "menubar.open": "Open Ahoy",
  "menubar.quit": "Quit Ahoy",
  "notification.title": "Ahoy is in your menubar",
  "notification.body":
    "Use the phone icon at the top of your screen to turn Ahoy on or off.",
} as const;

export const helperStatusCopy: Record<HelperStatus, string> = {
  starting: agentCopy["helper.starting"],
  running: agentCopy["helper.running"],
  stopped: agentCopy["helper.stopped"],
};

export const pairingFailureCopy: Record<PairingFailure, string> = {
  network: "Can't reach Ahoy's server. Check this Mac's internet connection.",
  server: "Something went wrong on our side. Try again.",
  updateRequired: "Update Ahoy on this Mac to pair a phone.",
  proofRejected:
    "That pairing did not check out, so this Mac refused it. Scan a new code.",
};
