import { normaliseLabel } from "./resolveTarget.ts";

const DESTRUCTIVE_LABELS = [
  "Delete",
  "Remove",
  "Erase",
  "Discard",
  "Trash",
  "Empty Trash",
  "Format",
  "Uninstall",
  "Don't Save",
  "Sign Out",
  "Log Out",
  "Close Without Saving",
  "Send",
  "Pay",
  "Buy",
  "Purchase",
  "Place Order",
  "Transfer",
  "Move to Trash",
  "Delete Forever",
  "Permanently Delete",
  "Reset",
  "Replace",
  "Overwrite",
  "Force Quit",
  "Shut Down",
  "Restart",
  "Leave",
  "Unsubscribe",
].map(normaliseLabel);

export function isDestructive(label: string): boolean {
  const words = ` ${normaliseLabel(label)} `;
  return DESTRUCTIVE_LABELS.some((danger) => words.includes(` ${danger} `));
}
