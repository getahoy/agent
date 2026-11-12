import {
  type Appearance,
  appearanceCopy as baseAppearanceCopy,
  type ResolvedTheme,
} from "@getahoy/lib";

const MENUBAR_NOTE = "The menubar icon always follows the menubar.";

export const appearanceCopy = {
  ...baseAppearanceCopy,
  caption: (choice: Appearance, resolved: ResolvedTheme) =>
    choice === "system"
      ? `System matches your Mac, now ${resolved}. ${MENUBAR_NOTE}`
      : `Ahoy stays ${choice}. ${MENUBAR_NOTE}`,
} as const;
