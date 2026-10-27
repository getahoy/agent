import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const APP_EXTENSION = ".app";
const SUBFOLDER_DEPTH = 1;

const APP_FOLDERS = [
  "/Applications",
  "/System/Applications",
  path.join(homedir(), "Applications"),
];

async function entriesOf(folder: string): Promise<Dirent[]> {
  return readdir(folder, { withFileTypes: true }).catch(() => []);
}

async function appsIn(folder: string, depth: number): Promise<string[]> {
  const entries = await entriesOf(folder);
  const isApp = (entry: Dirent) => entry.name.endsWith(APP_EXTENSION);
  const apps = entries
    .filter(isApp)
    .map((entry) => entry.name.slice(0, -APP_EXTENSION.length));
  if (depth === 0) return apps;
  const folders = entries.filter(
    (entry) => entry.isDirectory() && !isApp(entry),
  );
  const nested = await Promise.all(
    folders.map((entry) => appsIn(path.join(folder, entry.name), depth - 1)),
  );
  return [...apps, ...nested.flat()];
}

export async function installedApps(): Promise<string[]> {
  const lists = await Promise.all(
    APP_FOLDERS.map((folder) => appsIn(folder, SUBFOLDER_DEPTH)),
  );
  return [...new Set(lists.flat())];
}
