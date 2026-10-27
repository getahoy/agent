const MAX_CHOICES = 3;

function capitalised(name: string): string {
  return name.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function listed(apps: readonly string[]): string {
  const shown = apps.slice(0, MAX_CHOICES);
  const last = shown.at(-1) ?? "";
  if (shown.length < 2) return last;
  return `${shown.slice(0, -1).join(", ")} or ${last}`;
}

export const commandCopy = {
  unlockFirst: "Unlock your Mac to use Ahoy.",
  cannotDoYet: "I can’t do that yet.",
  failed: "That didn’t work on the Mac.",
  opened: (name: string) => `Opened ${name}`,
  closed: (app: string) => `Closed ${app}`,
  hid: (app: string) => `Hid ${app}`,
  switched: (app: string) => `Switched to ${app}`,
  searched: (query: string) => `Searched for ${query}`,
  notOpen: (app: string) => `${app} isn’t open`,
  askedToQuit: (app: string) =>
    `Asked ${app} to quit. It may be waiting for you to save.`,
  allowControl: (app: string) =>
    `Allow Ahoy to control ${app} in System Settings → Privacy & Security → Automation.`,
  noSuchApp: (name: string) => `Can’t find an app called ${capitalised(name)}`,
  which: (apps: readonly string[]) => `Which one: ${listed(apps)}?`,
};
