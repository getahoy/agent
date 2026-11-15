import { compactForm, writtenForm } from "./spokenForm.ts";

export type RecipientCheck = "exact" | "close" | "none";
export type HeardRecipients = { to: string | null; check: RecipientCheck };

const EMAIL_ADDRESS =
  /^[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
const CLOSE_EDITS = 2;
const CLOSE_SIMILARITY = 0.85;
const NONE: HeardRecipients = { to: null, check: "none" };

function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (const [row, leftCharacter] of [...left].entries()) {
    const current = [row + 1];
    for (const [column, rightCharacter] of [...right].entries()) {
      const same = leftCharacter === rightCharacter;
      const replace = (previous[column] ?? 0) + (same ? 0 : 1);
      const insert = (current[column] ?? 0) + 1;
      const remove = (previous[column + 1] ?? 0) + 1;
      current.push(Math.min(replace, insert, remove));
    }
    previous = current;
  }
  return previous[right.length] ?? 0;
}

function isClose(local: string, spokenBefore: string): boolean {
  for (let extra = -CLOSE_EDITS; extra <= CLOSE_EDITS; extra += 1) {
    const length = local.length + extra;
    if (length <= 0 || length > spokenBefore.length) continue;
    const spoken = spokenBefore.slice(-length);
    const edits = editDistance(local, spoken);
    const similarity = 1 - edits / Math.max(local.length, spoken.length);
    if (edits <= CLOSE_EDITS || similarity >= CLOSE_SIMILARITY) return true;
  }
  return false;
}

// The interpreter can guess a full address from a bare name, so the domain must have been said,
// and a local part that was not said exactly must at least follow a spoken "at".
function heardAddress(address: string, heard: string): RecipientCheck {
  if (!EMAIL_ADDRESS.test(address)) return "none";
  const [localPart = "", domainPart = ""] = address.split("@");
  const local = compactForm(localPart);
  const domain = compactForm(domainPart);
  if (local === "" || !heard.includes(domain)) return "none";
  if (heard.includes(local)) return "exact";
  const at = heard.indexOf(`@${domain}`);
  return at > 0 && isClose(local, heard.slice(0, at)) ? "close" : "none";
}

const MYSELF = /\b(?:myself|to me|my (?:own )?email)\b/i;
const OWN_EMAIL = /^(?:type|write|enter) my (?:own )?email(?: address)?$/;

export function asksForOwnEmail(command: string): boolean {
  return OWN_EMAIL.test(command);
}

// The account email never reaches the AI: a draft "to myself" comes back empty and is filled here.
export function draftRecipients(
  to: string | null,
  transcript: string,
  accountEmail: string | null,
): { to: string | null; recipient: RecipientCheck | "self" } {
  const heard = heardRecipients(to, transcript);
  if (heard.to || !accountEmail || !MYSELF.test(transcript)) {
    return { to: heard.to, recipient: heard.check };
  }
  return { to: accountEmail, recipient: "self" };
}

// The interpreter sometimes adds a dot between spoken words; one that was never said is dropped.
function withSaidSeparators(address: string, written: string): string {
  if (written.includes(address.toLowerCase())) return address;
  const [localPart = "", domainPart = ""] = address.split("@");
  const bare = `${localPart.replace(/[._-]/g, "")}@${domainPart}`;
  return written.includes(bare.toLowerCase()) ? bare : address;
}

function heardRecipients(
  to: string | null,
  transcript: string,
): HeardRecipients {
  if (to === null) return NONE;
  const written = writtenForm(transcript).replace(/\s/g, "");
  const heard = compactForm(written);
  const checked = to
    .split(/[,;\s]+/)
    .filter((address) => address !== "")
    .map((address) => withSaidSeparators(address, written))
    .map((address) => ({ address, check: heardAddress(address, heard) }))
    .filter(({ check }) => check !== "none");
  if (checked.length === 0) return NONE;
  const close = checked.some(({ check }) => check === "close");
  const addresses = checked.map(({ address }) => address).join(", ");
  return { to: addresses, check: close ? "close" : "exact" };
}
