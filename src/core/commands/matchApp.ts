export type AppMatch =
  | { kind: "one"; app: string }
  | { kind: "many"; apps: readonly string[] }
  | { kind: "none" };

type Tier = (app: string, spoken: string) => boolean;

const tiers: readonly Tier[] = [
  (app, spoken) => app === spoken,
  (app, spoken) => app.startsWith(spoken) || ` ${app} `.includes(` ${spoken} `),
  (app, spoken) => app.includes(spoken),
];

export function matchApp(
  spoken: string,
  installedApps: readonly string[],
): AppMatch {
  const wanted = spoken.toLowerCase().trim();
  if (wanted === "") return { kind: "none" };
  for (const tier of tiers) {
    const matches = installedApps.filter((app) =>
      tier(app.toLowerCase(), wanted),
    );
    const unique = [...new Set(matches)].sort();
    const [only] = unique;
    if (unique.length === 1 && only) return { kind: "one", app: only };
    if (unique.length > 1) return { kind: "many", apps: unique };
  }
  return { kind: "none" };
}
