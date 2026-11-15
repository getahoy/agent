import { commandCopy } from "../../copy/commandCopy.ts";
import { chooseBrowser, draftOpensIn } from "../../core/commands/browsers.ts";
import {
  type CommandOutcome,
  done,
  failed,
  spoken,
} from "../../core/commands/commandLog.ts";
import { draftUrl } from "../../core/commands/draftUrl.ts";
import type { EmailDraft, Intent } from "../../core/commands/intent.ts";
import { nameOfAddress } from "../../core/voice/spokenWords.ts";
import { installedApps } from "./installedApps.ts";
import { defaultMailtoApp } from "./mailtoHandler.ts";
import { openWith } from "./osaScript.ts";

const SEARCH_URL = "https://www.google.com/search?q=";

type WebIntent = Extract<
  Intent,
  { kind: "search" | "openSite" | "draftEmail" }
>;

type Opener =
  | { kind: "open"; args: string[] }
  | { kind: "missing"; name: string };

function browserOpener(
  url: string,
  named: string | null,
  apps: readonly string[],
): Opener {
  const choice = chooseBrowser(named, apps);
  if (choice.kind === "notInstalled") {
    return { kind: "missing", name: choice.browser };
  }
  const args = choice.browser ? ["-a", choice.browser, url] : [url];
  return { kind: "open", args };
}

async function draftOpener(
  intent: EmailDraft,
  apps: readonly string[],
): Promise<Opener> {
  const gmail = () =>
    browserOpener(draftUrl({ ...intent, via: "gmail" }), intent.browser, apps);
  if (intent.via === "gmail") return gmail();
  const { mailApp } = intent;
  if (mailApp && !mailApp.installed) {
    return { kind: "missing", name: mailApp.name };
  }
  const mailto = draftUrl(intent);
  if (mailApp) return { kind: "open", args: ["-a", mailApp.name, mailto] };
  const opensIn = draftOpensIn(await defaultMailtoApp());
  return opensIn === "gmail" ? gmail() : { kind: "open", args: [mailto] };
}

function draftMessage(intent: EmailDraft): string {
  if (intent.sending) return commandCopy.draftedNotSent;
  const close = intent.recipient === "close" && intent.to;
  if (close) return commandCopy.checkAddress(close);
  return commandCopy.drafted(intent.to);
}

async function opened(opener: Opener, message: string) {
  if (opener.kind === "missing") {
    return failed(commandCopy.notInstalled(opener.name));
  }
  await openWith(opener.args);
  return done(message);
}

async function runDraft(intent: EmailDraft, apps: readonly string[]) {
  const message = draftMessage(intent);
  const outcome = await opened(await draftOpener(intent, apps), message);
  if (outcome.status !== "done") return outcome;
  if (intent.sending) return spoken(outcome, { kind: "say", message });
  const name = intent.to ? nameOfAddress(intent.to) : null;
  return spoken(outcome, { kind: "draft", name });
}

export async function runWebIntent(intent: WebIntent): Promise<CommandOutcome> {
  const apps = await installedApps();
  const { browser } = intent;
  switch (intent.kind) {
    case "search": {
      const url = `${SEARCH_URL}${encodeURIComponent(intent.query)}`;
      const searched = commandCopy.searched(intent.query);
      const message = commandCopy.inBrowser(searched, browser);
      return opened(browserOpener(url, browser, apps), message);
    }
    case "openSite": {
      const url = `https://${intent.host}`;
      const site = commandCopy.opened(intent.host);
      const message = commandCopy.inBrowser(site, browser);
      return opened(browserOpener(url, browser, apps), message);
    }
    case "draftEmail":
      return runDraft(intent, apps);
    default: {
      const unhandled: never = intent;
      throw new Error(`Unhandled web intent ${JSON.stringify(unhandled)}`);
    }
  }
}
