import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

const STORAGE_KEY = "theme";
const INERT_SCRIPT = { type: "application/json" } as const;

// The settings file in the main process is the stored choice; next-themes keeps its
// own copy in localStorage, so that copy is overwritten from main on every load.
export function seedStoredAppearance(): void {
  try {
    localStorage.setItem(STORAGE_KEY, window.ahoy.initialAppearance);
  } catch {
    return;
  }
}

type AppearanceProviderProps = { children: ReactNode };

// The inline script next-themes renders never runs in a client-only app; marking it
// as data stops React warning about it. The first paint is right anyway, because
// prefers-color-scheme already follows nativeTheme.themeSource.
export function AppearanceProvider({ children }: AppearanceProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
      storageKey={STORAGE_KEY}
      scriptProps={INERT_SCRIPT}
    >
      {children}
    </ThemeProvider>
  );
}
