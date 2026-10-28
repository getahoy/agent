export type BlockedApp = { kind: "bundleId"; value: string };

const bundleId = (value: string): BlockedApp => ({ kind: "bundleId", value });

export const DEFAULT_BLOCKED_APPS: readonly BlockedApp[] = [
  bundleId("com.1password.1password"),
  bundleId("com.agilebits.onepassword7"),
  bundleId("com.bitwarden.desktop"),
  bundleId("com.lastpass.LastPass"),
  bundleId("com.dashlane.Dashlane"),
  bundleId("org.keepassxc.keepassxc"),
  bundleId("com.apple.keychainaccess"),
  bundleId("com.apple.Passwords"),
];

export function isBlockedApp(
  frontBundleId: string,
  blocked: readonly BlockedApp[],
): boolean {
  const wanted = frontBundleId.toLowerCase();
  return blocked.some((app) => app.value.toLowerCase() === wanted);
}
