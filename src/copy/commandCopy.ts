import type { KeyModifier, KeyName } from "@getahoy/protocol";

const MAX_CHOICES = 3;

const MODIFIER_ORDER: readonly KeyModifier[] = [
  "control",
  "alt",
  "shift",
  "mod",
];

const modifierSymbols: Record<KeyModifier, string> = {
  control: "⌃",
  alt: "⌥",
  shift: "⇧",
  mod: "⌘",
};

const keyLabels: Partial<Record<KeyName, string>> = {
  return: "Return",
  tab: "Tab",
  space: "Space",
  delete: "Delete",
  forwardDelete: "Forward Delete",
  escape: "Escape",
  home: "Home",
  end: "End",
  pageUp: "Page Up",
  pageDown: "Page Down",
  left: "←",
  right: "→",
  up: "↑",
  down: "↓",
};

type Shortcut = { key: KeyName; modifiers: readonly KeyModifier[] };

function shortcutLabel({ key, modifiers }: Shortcut): string {
  const held = MODIFIER_ORDER.filter((modifier) =>
    modifiers.includes(modifier),
  );
  const symbols = held.map((modifier) => modifierSymbols[modifier]).join("");
  return `${symbols}${keyLabels[key] ?? key.toUpperCase()}`;
}

function capitalised(name: string): string {
  return name.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function listed(names: readonly string[]): string {
  const shown = names.slice(0, MAX_CHOICES);
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
  inBrowser: (message: string, browser: string | null) =>
    browser ? `${message} in ${browser}` : message,
  notOpen: (app: string) => `${app} isn’t open`,
  askedToQuit: (app: string) =>
    `Asked ${app} to quit. It may be waiting for you to save.`,
  allowControl: (app: string) =>
    `Allow Ahoy to control ${app} in System Settings → Privacy & Security → Automation.`,
  noSuchApp: (name: string) => `Can’t find an app called ${capitalised(name)}`,
  pressed: (shortcut: Shortcut) => `Pressed ${shortcutLabel(shortcut)}`,
  typed: (text: string) => `Typed “${text}”`,
  secureInput: "I won’t type into a password field.",
  smartUnavailable: "Smart commands aren’t working right now.",
  notInFront: (app: string) => `${app} didn’t come to the front, so I stopped.`,
  closedTab: (match: string) => `Closed the ${capitalised(match)} tab`,
  switchedTab: (match: string) => `Switched to the ${capitalised(match)} tab`,
  noTab: (match: string, browser: string | null) =>
    `No tab matching ${match} in ${browser ?? "any open browser"}`,
  manyTabs: (titles: readonly string[]) =>
    `${titles.length} tabs match: ${titles.slice(0, MAX_CHOICES).join(", ")}${titles.length > MAX_CHOICES ? ", …" : ""}. Say which one.`,
  noTabControl: (browser: string | null) =>
    browser
      ? `I can’t control tabs in ${browser} yet.`
      : "Open a browser first.",
  drafted: (to: string | null) =>
    to
      ? `Drafted an email to ${to}. Check it and press Send.`
      : "Drafted an email. Add who it goes to, then press Send.",
  clicked: (label: string) => `Clicked ${capitalised(label)}`,
  noTarget: (label: string) =>
    `Can’t find ${capitalised(label)} on the screen.`,
  manyTargets: (label: string) =>
    `More than one ${capitalised(label)} on the screen. Pick a number.`,
  screenChanged: "The screen changed, say it again.",
  noWindow: "There’s no window in front to click in.",
  which: (apps: readonly string[]) => `Which one: ${listed(apps)}?`,
};
