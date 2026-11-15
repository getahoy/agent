import { osaScript } from "./osaScript.ts";

const APP_EXTENSION = ".app";
const DEFAULT_MAILTO_APP = [
  'ObjC.import("AppKit")',
  'const mailto = $.NSURL.URLWithString("mailto:")',
  "const app = $.NSWorkspace.sharedWorkspace.URLForApplicationToOpenURL(mailto)",
  'app.isNil() ? "" : ObjC.unwrap(app.lastPathComponent)',
];

export async function defaultMailtoApp(): Promise<string | null> {
  const script = await osaScript("JavaScript", DEFAULT_MAILTO_APP, []);
  if (script.kind !== "answered") return null;
  const bundle = script.answer;
  if (!bundle.endsWith(APP_EXTENSION)) return null;
  return bundle.slice(0, -APP_EXTENSION.length);
}
