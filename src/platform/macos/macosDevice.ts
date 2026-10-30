import { execFile } from "node:child_process";
import { hostname } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { app, type NativeImage, nativeImage } from "electron";
import type { DeviceIdentity, MenubarStatus } from "../../ports/platform.ts";

const HELPER_CAPABILITIES = ["snapshot", "click", "key", "type", "capture"];
const MENUBAR_ICON_FOLDER = "menubar";

const menubarIconFiles: Record<MenubarStatus, string> = {
  connected: "pennantSolidTemplate.png",
  noPhone: "pennantOutlineTemplate.png",
  off: "pennantSlashTemplate.png",
  needsPermission: "pennantDotTemplate.png",
};

const menubarIcons = new Map<MenubarStatus, NativeImage>();

function menubarIconFolder(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, MENUBAR_ICON_FOLDER);
  }
  return path.join(app.getAppPath(), "assets", MENUBAR_ICON_FOLDER);
}

const runFile = promisify(execFile);

async function computerName(): Promise<string> {
  const named = await runFile("scutil", ["--get", "ComputerName"]).catch(
    () => null,
  );
  const name = named?.stdout.trim();
  return name ? name : hostname().replace(/\.local$/, "");
}

export async function macosDeviceIdentity(): Promise<DeviceIdentity> {
  return {
    platform: "macos",
    platformVersion: process.getSystemVersion(),
    displayName: await computerName(),
    capabilities: HELPER_CAPABILITIES,
  };
}

export function macosMenubarIcon(status: MenubarStatus): NativeImage {
  const cached = menubarIcons.get(status);
  if (cached) return cached;
  const file = path.join(menubarIconFolder(), menubarIconFiles[status]);
  const icon = nativeImage.createFromPath(file);
  icon.setTemplateImage(true);
  menubarIcons.set(status, icon);
  return icon;
}
