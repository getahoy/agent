import type { EmailDraft } from "./intent.ts";

const EMAIL_ADDRESS =
  /^[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

function lettersOf(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function spokenDomain(domain: string): string {
  return lettersOf(domain.replace(/\./g, " dot "));
}

// The interpreter can guess a full address from a bare name, so both halves must have been said.
export function spokenRecipient(
  draft: EmailDraft,
  transcript: string,
): string | null {
  if (draft.to === null || !EMAIL_ADDRESS.test(draft.to)) return null;
  const [localPart = "", domain = ""] = draft.to.split("@");
  const heard = lettersOf(transcript);
  const local = lettersOf(localPart);
  const saidLocal = local !== "" && heard.includes(local);
  const saidDomain =
    heard.includes(spokenDomain(domain)) || heard.includes(lettersOf(domain));
  return saidLocal && saidDomain ? draft.to : null;
}
