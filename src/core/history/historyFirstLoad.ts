type FirstLoadFacts = {
  pending: boolean;
  cachedPages: number;
  localEntries: number;
};

// Nothing cached for this view and nothing this Mac just did: only then is there nothing to show.
export function waitsForFirstLoad(facts: FirstLoadFacts): boolean {
  return facts.pending && facts.cachedPages === 0 && facts.localEntries === 0;
}
