import type { Platform } from "@getahoy/protocol";

export type Permission = "accessibility" | "screenRecording";

export type PermissionState = Record<Permission, boolean>;

export type HelperBinary = {
  path: string;
  args: readonly string[];
};

export type MenubarStatus = "off" | "disconnected" | "connected" | "error";

export type DeviceIdentity = {
  platform: Platform;
  platformVersion: string;
  displayName: string;
  capabilities: readonly string[];
};

export interface PermissionController {
  read(): PermissionState;
  openSettings(permission: Permission): Promise<void>;
}

export interface LifecycleController {
  showWindowSurface(): void;
  hideWindowSurface(): void;
  relaunch(): void;
}

export interface PlatformAdapter {
  readonly permissions: PermissionController;
  readonly lifecycle: LifecycleController;
  helperBinary(): HelperBinary;
  settingsFilePath(): string;
  identityFilePath(): string;
  deviceIdentity(): Promise<DeviceIdentity>;
}
