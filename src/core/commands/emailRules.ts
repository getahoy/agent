import type { EmailDraft } from "./intent.ts";

const EMAIL_ADDRESS =
  /^[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

function lettersOf(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function allowsEmailDraft(
  draft: EmailDraft,
  transcript: string,
): boolean {
  if (draft.to === null) return true;
  if (!EMAIL_ADDRESS.test(draft.to)) return false;
  const [localPart = ""] = draft.to.split("@");
  const spoken = lettersOf(localPart);
  return spoken !== "" && lettersOf(transcript).includes(spoken);
}
