const UNITS: Readonly<Record<string, number>> = {
  zero: 0,
  oh: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};
const TEENS: Readonly<Record<string, number>> = {
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};
const TENS: Readonly<Record<string, number>> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};
const REPEATS: Readonly<Record<string, number>> = { double: 2, triple: 3 };
const SYMBOLS: Readonly<Record<string, string>> = {
  at: "@",
  dot: ".",
  period: ".",
  point: ".",
  underscore: "_",
  dash: "-",
  hyphen: "-",
  minus: "-",
  plus: "+",
};
const AT_PHRASES: readonly (readonly string[])[] = [
  ["at", "the", "rate"],
  ["at", "sign"],
];
const DIGITS = /^\d+$/;

function digitWord(word: string | undefined, next: string | undefined) {
  if (word === undefined) return undefined;
  if (DIGITS.test(word)) return word;
  if (word === "o" && next !== undefined && digitWord(next, undefined)) {
    return "0";
  }
  const unit = UNITS[word];
  return unit === undefined ? undefined : String(unit);
}

function number(words: readonly string[], at: number): [string, number] | null {
  const [word = "", next, after] = words.slice(at);
  const times = REPEATS[word];
  const repeated = times ? digitWord(next, after) : undefined;
  if (times && repeated) return [repeated.repeat(times), 2];
  const teen = TEENS[word];
  if (teen !== undefined) return [String(teen), 1];
  const tens = TENS[word];
  if (tens !== undefined) {
    const unit = next === undefined ? undefined : UNITS[next];
    return unit ? [String(tens + unit), 2] : [String(tens), 1];
  }
  const digit = digitWord(word, next);
  return digit === undefined ? null : [digit, 1];
}

function atPhrase(words: readonly string[], at: number): number {
  const phrase = AT_PHRASES.find((parts) =>
    parts.every((part, index) => words[at + index] === part),
  );
  return phrase?.length ?? 0;
}

function pieces(words: readonly string[]): string[] {
  const found: string[] = [];
  let at = 0;
  while (at < words.length) {
    const word = words[at] ?? "";
    const phrase = atPhrase(words, at);
    const digits = phrase ? null : number(words, at);
    found.push(phrase ? "@" : (digits?.[0] ?? SYMBOLS[word] ?? word));
    at += phrase || (digits?.[1] ?? 1);
  }
  return found;
}

const WRITTEN_TEXT =
  /^(?:\S+@\S+\.\S+|https?:\/\/\S+|[a-z0-9-]+(?:\.[a-z0-9-]+)+|[\d\s.,+()-]+)$/i;

// Only addresses, links and numbers are matched in written form; other text must be said as is,
// so "type hello at noon" types those words, not "hello@noon".
export function saidAsWritten(text: string, transcript: string): boolean {
  if (!WRITTEN_TEXT.test(text.trim())) return false;
  return compactForm(writtenForm(transcript)).includes(compactForm(text));
}

// For comparing: separators like dots and dashes are optional when an address is spoken.
export function compactForm(text: string): string {
  return text.toLowerCase().replace(/[\s._-]/g, "");
}

// Spaces are dropped too: a spoken address has none, and the checks only look for it inside.
export function writtenForm(transcript: string): string {
  const words = transcript
    .toLowerCase()
    .replace(/[!?,;:"“”‘’]/g, " ")
    .replace(/\.(?=\s|$)/g, " ")
    .split(/\s+/)
    .filter((word) => word !== "");
  return pieces(words).join("");
}
