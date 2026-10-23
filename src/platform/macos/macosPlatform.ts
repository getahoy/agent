import path from "node:path";
import { app, shell, systemPreferences } from "electron";
import type {
  DeviceIdentity,
  HelperBinary,
  LifecycleController,
  Permission,
  PermissionController,
  PermissionState,
  PlatformAdapter,
} from "../../ports/platform.ts";
import { macosHelperBinary, packagedHelperBinary } from "./helperBinary.ts";
import { macosDeviceIdentity } from "./macosDevice.ts";

const SETTINGS_FILE_NAME = "settings.json";
const IDENTITY_FILE_NAME = "identity.bin";

const privacySettingsLinks: Record<Permission, string> = {
  accessibility:
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
  screenRecording:
    "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
};

class MacosPermissions implements PermissionController {
  read(): PermissionState {
    return {
      accessibility: systemPreferences.isTrustedAccessibilityClient(false),
      screenRecording:
        systemPreferences.getMediaAccessStatus("screen") === "granted",
    };
  }

  async openSettings(permission: Permission): Promise<void> {
    await shell.openExternal(privacySettingsLinks[permission]);
  }
}

class MacosLifecycle implements LifecycleController {
  showWindowSurface(): void {
    void app.dock?.show();
    app.focus({ steal: true });
  }

  hideWindowSurface(): void {
    app.dock?.hide();
  }

  relaunch(): void {
    app.relaunch();
    app.exit(0);
  }
}

export class MacosPlatform implements PlatformAdapter {
  readonly permissions = new MacosPermissions();
  readonly lifecycle = new MacosLifecycle();

  helperBinary(): HelperBinary {
    return app.isPackaged
      ? packagedHelperBinary(process.resourcesPath)
      : macosHelperBinary(app.getAppPath());
  }

  settingsFilePath(): string {
    return path.join(app.getPath("userData"), SETTINGS_FILE_NAME);
  }

  identityFilePath(): string {
    return path.join(app.getPath("userData"), IDENTITY_FILE_NAME);
  }

  deviceIdentity(): Promise<DeviceIdentity> {
    return macosDeviceIdentity();
  }
}
