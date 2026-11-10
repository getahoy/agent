import type {
  Appearance,
  ResolvedTheme,
} from "../core/appearance/appearance.ts";

const MENUBAR_NOTE = "The menubar icon always follows the menubar.";

export const appearanceCopy = {
  title: "Appearance",
  options: {
    system: "System",
    light: "Light",
    dark: "Dark",
  } satisfies Record<Appearance, string>,
  caption: (choice: Appearance, resolved: ResolvedTheme) =>
    choice === "system"
      ? `System matches your Mac, now ${resolved}. ${MENUBAR_NOTE}`
      : `Ahoy stays ${choice}. ${MENUBAR_NOTE}`,
} as const;
