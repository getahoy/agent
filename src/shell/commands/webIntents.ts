import { commandCopy } from "../../copy/commandCopy.ts";
import { type CommandOutcome, done } from "../../core/commands/commandLog.ts";
import { draftUrl } from "../../core/commands/draftUrl.ts";
import type { Intent } from "../../core/commands/intent.ts";
import { openWith } from "./osaScript.ts";

const SEARCH_URL = "https://www.google.com/search?q=";

type WebIntent = Extract<
  Intent,
  { kind: "search" | "openSite" | "draftEmail" }
>;

function inBrowser(url: string, browser: string | null): string[] {
  return browser ? ["-a", browser, url] : [url];
}

async function openUrl(url: string, browser: string | null, message: string) {
  await openWith(inBrowser(url, browser));
  return done(message);
}

export function runWebIntent(intent: WebIntent): Promise<CommandOutcome> {
  const { browser } = intent;
  switch (intent.kind) {
    case "search": {
      const url = `${SEARCH_URL}${encodeURIComponent(intent.query)}`;
      const searched = commandCopy.searched(intent.query);
      return openUrl(url, browser, commandCopy.inBrowser(searched, browser));
    }
    case "openSite": {
      const opened = commandCopy.opened(intent.host);
      const message = commandCopy.inBrowser(opened, browser);
      return openUrl(`https://${intent.host}`, browser, message);
    }
    case "draftEmail": {
      const gmailIn = intent.via === "gmail" ? browser : null;
      return openUrl(draftUrl(intent), gmailIn, commandCopy.drafted(intent.to));
    }
    default: {
      const unhandled: never = intent;
      throw new Error(`Unhandled web intent ${JSON.stringify(unhandled)}`);
    }
  }
}
