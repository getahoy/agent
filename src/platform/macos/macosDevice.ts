import { execFile } from "node:child_process";
import { hostname } from "node:os";
import { promisify } from "node:util";
import { type NativeImage, nativeImage } from "electron";
import type { DeviceIdentity, MenubarStatus } from "../../ports/platform.ts";

const MENUBAR_POINT_SIZE = 15;
const HELPER_CAPABILITIES = ["snapshot", "click", "key", "type", "capture"];

const menubarSymbols: Record<MenubarStatus, string> = {
  off: "iphone.slash",
  disconnected: "iphone",
  connected: "iphone.radiowaves.left.and.right",
  error: "exclamationmark.triangle",
};

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
  const icon = nativeImage.createFromNamedImage(menubarSymbols[status], {
    pointSize: MENUBAR_POINT_SIZE,
  });
  icon.setTemplateImage(true);
  return icon;
}
