import type { EmailDraft } from "./intent.ts";

const GMAIL_COMPOSE = "https://mail.google.com/mail/?view=cm&fs=1";

export function draftUrl({ to, subject, body, via }: EmailDraft): string {
  const recipient = encodeURIComponent(to ?? "");
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  if (via === "gmail") {
    return `${GMAIL_COMPOSE}&to=${recipient}&su=${encodedSubject}&body=${encodedBody}`;
  }
  return `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;
}
