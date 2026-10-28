export type BrowserTab = {
  browser: string;
  window: number;
  tab: number;
  title: string;
  url: string;
};

export type TabMatch =
  | { kind: "one"; tab: BrowserTab }
  | { kind: "many"; tabs: readonly BrowserTab[] }
  | { kind: "none" };

// Speech hears "grok" for "groq": compare how words sound when spelling finds nothing.
export function soundKey(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/ph/g, "f")
    .replace(/ck|q|c(?=[aou]|$)/g, "k")
    .replace(/z/g, "s")
    .replace(/(?!^)[aeiouy]/g, "")
    .replace(/(.)\1+/g, "$1");
}

function wordsOf(tab: BrowserTab): string[] {
  return `${tab.title} ${tab.url}`.toLowerCase().split(/[^a-z0-9]+/);
}

function spelledLike(tab: BrowserTab, wanted: string, compact: string) {
  return (
    tab.title.toLowerCase().includes(wanted) ||
    tab.url.toLowerCase().includes(compact)
  );
}

function soundsLike(tab: BrowserTab, wantedKey: string): boolean {
  return wordsOf(tab).some(
    (word) => word !== "" && soundKey(word) === wantedKey,
  );
}

function oneOrMany(found: readonly BrowserTab[]): TabMatch {
  const [only] = found;
  if (found.length === 1 && only) return { kind: "one", tab: only };
  return found.length === 0 ? { kind: "none" } : { kind: "many", tabs: found };
}

export function matchTabs(
  tabs: readonly BrowserTab[],
  match: string,
): TabMatch {
  const wanted = match.toLowerCase().trim();
  if (wanted === "") return { kind: "none" };
  const compact = wanted.replace(/\s+/g, "");
  const spelled = tabs.filter((tab) => spelledLike(tab, wanted, compact));
  if (spelled.length > 0) return oneOrMany(spelled);
  const wantedKey = soundKey(compact);
  if (wantedKey.length < 2) return { kind: "none" };
  return oneOrMany(tabs.filter((tab) => soundsLike(tab, wantedKey)));
}
