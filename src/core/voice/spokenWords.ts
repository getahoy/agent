import { MAX_SPEECH_CHARS } from "@getahoy/protocol";

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

export function spokenNumber(number: number): string {
  return NUMBER_WORDS[number] ?? String(number);
}

export function sayOneOf(count: number): string {
  if (count === 2) return "Say one or two";
  if (count === 3) return "Say one, two or three";
  return `Say a number from one to ${spokenNumber(count)}`;
}

const ROLE_NOUNS: Readonly<Record<string, string>> = {
  AXButton: "buttons",
  AXLink: "links",
  AXMenuItem: "menu items",
  AXCheckBox: "checkboxes",
  AXRadioButton: "options",
  AXTextField: "fields",
};

export function nounsFor(roles: readonly string[]): string {
  const [first] = roles;
  const same = first !== undefined && roles.every((role) => role === first);
  return (same && ROLE_NOUNS[first]) || "matches";
}

// Only the local part, made readable: the full address is never read out.
export function nameOfAddress(address: string): string {
  const [local = ""] = address.split("@");
  const words = local.split(/[._+-]+|\d+/).filter((word) => word !== "");
  return words.map(capitalised).join(" ");
}

export function capitalised(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function sentence(text: string): string {
  const trimmed = capitalised(text.trim());
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

// Cut at a sentence boundary so a long reply never stops mid-word.
export function withinSpeechLimit(text: string): string {
  if (text.length <= MAX_SPEECH_CHARS) return text;
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  let kept = "";
  for (const next of sentences) {
    if ((kept + next).trim().length > MAX_SPEECH_CHARS) break;
    kept += next;
  }
  const cut = kept.trim();
  if (cut !== "") return cut;
  const words = text.slice(0, MAX_SPEECH_CHARS - 1).replace(/\s+\S*$/, "");
  return `${words}.`;
}
