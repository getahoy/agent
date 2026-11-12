import type { ResolvedTheme } from "@getahoy/lib";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const SETTLE_LIMIT_MS = 200;

// nativeTheme reaches the renderer's prefers-color-scheme on its own channel, after
// the IPC reply; System resolves from it, so the switch waits for it to arrive.
export function schemeSettled(resolved: ResolvedTheme): Promise<void> {
  const query = window.matchMedia(DARK_QUERY);
  if (query.matches === (resolved === "dark")) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(limit);
      query.removeEventListener("change", done);
      resolve();
    };
    const limit = setTimeout(done, SETTLE_LIMIT_MS);
    query.addEventListener("change", done);
  });
}
