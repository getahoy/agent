export type ChoiceAnswer =
  | { kind: "pick"; number: number }
  | { kind: "outOfRange"; number: number }
  | { kind: "cancel" }
  | { kind: "delegate" };

const MAX_ANSWER_WORDS = 4;
const LAST = -1;

// Sound-alikes are only trusted here, inside a short answer to an open choice.
const NUMBER_WORDS = new Map<string, number>([
  ["one", 1],
  ["won", 1],
  ["first", 1],
  ["ek", 1],
  ["pehla", 1],
  ["two", 2],
  ["to", 2],
  ["too", 2],
  ["second", 2],
  ["do", 2],
  ["doosra", 2],
  ["three", 3],
  ["tree", 3],
  ["third", 3],
  ["teen", 3],
  ["teesra", 3],
  ["four", 4],
  ["for", 4],
  ["fore", 4],
  ["fourth", 4],
  ["chaar", 4],
  ["chautha", 4],
  ["five", 5],
  ["fifth", 5],
  ["paanch", 5],
  ["six", 6],
  ["sixth", 6],
  ["chhe", 6],
  ["seven", 7],
  ["seventh", 7],
  ["saat", 7],
  ["eight", 8],
  ["ate", 8],
  ["eighth", 8],
  ["aath", 8],
  ["nine", 9],
  ["ninth", 9],
  ["nau", 9],
  ["last", LAST],
  ["aakhri", LAST],
]);

const FILLERS = new Set(["number", "option", "the", "please", "wala", "wali"]);

const CANCEL = new Set([
  "cancel",
  "none",
  "neither",
  "never mind",
  "stop",
  "chhodo",
  "rehne do",
  "kuch nahi",
]);

const DELEGATE = new Set([
  "any",
  "anything",
  "either",
  "whichever",
  "you pick",
  "you choose",
  "i dont know",
  "koi bhi",
  "tum chuno",
]);

function plainWords(text: string): string[] {
  const plain = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "");
  return plain.split(/\s+/).filter((word) => word !== "");
}

function numberIn(words: readonly string[], optionCount: number) {
  const kept = words.filter((word) => !FILLERS.has(word));
  const numbers =
    kept.length > 1 ? kept.filter((word) => word !== "one") : kept;
  const [word] = numbers;
  if (numbers.length !== 1 || word === undefined) return null;
  const number = /^\d$/.test(word) ? Number(word) : NUMBER_WORDS.get(word);
  if (number === undefined || number === 0) return null;
  return number === LAST ? optionCount : number;
}

export function parseChoiceAnswer(
  text: string,
  optionCount: number,
): ChoiceAnswer | null {
  const words = plainWords(text);
  if (words.length === 0 || words.length > MAX_ANSWER_WORDS) return null;
  const phrase = words.join(" ");
  if (CANCEL.has(phrase)) return { kind: "cancel" };
  if (DELEGATE.has(phrase)) return { kind: "delegate" };
  const number = numberIn(words, optionCount);
  if (number === null) return null;
  const inRange = number >= 1 && number <= optionCount;
  return inRange ? { kind: "pick", number } : { kind: "outOfRange", number };
}
