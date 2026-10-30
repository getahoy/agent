export const homeCopy = {
  connected: "Connected",
  off: "Ahoy is off. Your phone cannot connect.",
  remove: "Remove phone",
  pairNew: "Pair a new phone",
  lastConnected: "Last connected",
  signedInAs: "Signed in as",
  signOut: "Sign out",
  dismiss: "Dismiss",
  ready: (phone: string) => `Not connected. Open Ahoy on ${phone} to connect.`,
  paused: (phone: string) => `${phone} paused the connection.`,
  heard: (text: string) => `“${text}”`,
  heardAt: (eyebrow: string, when: string) => `${eyebrow} · ${when}`,
  phoneWithStatus: (phone: string, status: string) => `${phone} · ${status}`,
  removeTitle: (phone: string) => `Remove ${phone}?`,
  signOutBody: (phone: string) =>
    `${phone} will be removed and you will need to scan a new code to use Ahoy again.`,
  removedBanner: (phone: string) => `${phone} removed this Mac.`,
  signedOutBanner: (phone: string) => `${phone} signed out of Ahoy.`,
  newPhoneHint: (phone: string) =>
    `Scan this code with the new phone. ${phone} keeps working until the new phone scans it, then it is removed from this Mac.`,
};
