export type BrowserTab = {
  window: number;
  tab: number;
  title: string;
  url: string;
};

export type TabMatch =
  | { kind: "one"; tab: BrowserTab }
  | { kind: "many"; tabs: readonly BrowserTab[] }
  | { kind: "none" };

export function matchTabs(
  tabs: readonly BrowserTab[],
  match: string,
): TabMatch {
  const wanted = match.toLowerCase().trim();
  if (wanted === "") return { kind: "none" };
  const compact = wanted.replace(/\s+/g, "");
  const found = tabs.filter(
    (tab) =>
      tab.title.toLowerCase().includes(wanted) ||
      tab.url.toLowerCase().includes(compact),
  );
  const [only] = found;
  if (found.length === 1 && only) return { kind: "one", tab: only };
  return found.length === 0 ? { kind: "none" } : { kind: "many", tabs: found };
}
