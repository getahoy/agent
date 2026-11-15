import type { InterpretAction } from "@getahoy/protocol";
import { draftRecipients } from "./emailRules.ts";
import type { EmailDraft, MailApp } from "./intent.ts";
import { matchApp } from "./matchApp.ts";

type DraftAction = Extract<InterpretAction, { kind: "draftEmail" }>;
type DraftContext = {
  transcript: string;
  installedApps: readonly string[];
  accountEmail: string | null;
};

const MAIL_APP_NAMES: Readonly<Record<string, string>> = {
  "apple mail": "Mail",
  "the mail app": "Mail",
  "microsoft outlook": "Microsoft Outlook",
  outlook: "Microsoft Outlook",
  spark: "Spark",
  airmail: "Airmail",
  superhuman: "Superhuman",
};
const NAMED_APP = new RegExp(
  `\\b(?:in|with|on|using|via|from) (${Object.keys(MAIL_APP_NAMES).join("|")})\\b`,
  "i",
);
const SEND = /\bsend\b/i;

function mailAppOf(
  transcript: string,
  installedApps: readonly string[],
): MailApp | null {
  const spoken = NAMED_APP.exec(transcript)?.[1]?.toLowerCase();
  const name = spoken === undefined ? undefined : MAIL_APP_NAMES[spoken];
  if (!name) return null;
  const match = matchApp(name, installedApps);
  if (match.kind === "one") return { name: match.app, installed: true };
  return { name, installed: false };
}

// Every verb stays a draft; "send" only changes the reply.
export function draftFor(
  action: DraftAction,
  { transcript, installedApps, accountEmail }: DraftContext,
): EmailDraft {
  const heard = draftRecipients(action.to, transcript, accountEmail);
  const inGmail = action.via === "gmail";
  const mailApp = inGmail ? null : mailAppOf(transcript, installedApps);
  return { ...action, ...heard, mailApp, sending: SEND.test(transcript) };
}
