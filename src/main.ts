import { spawn } from "node:child_process";
import { app, powerMonitor } from "electron";
import { HelperClient } from "./core/helper/helperClient.ts";
import { MacosPlatform } from "./platform/macos/macosPlatform.ts";
import { AgentController } from "./shell/agentController.ts";
import { AgentTray } from "./shell/agentTray.ts";
import { registerBridge } from "./shell/bridgeIpc.ts";
import { MainWindow } from "./shell/mainWindow.ts";
import { readSettings } from "./shell/settingsStore.ts";

const HELPER_REQUEST_TIMEOUT_MS = 10_000;
const HELPER_RESTART_DELAYS_MS = [250, 1000, 5000] as const;

async function startAgent(): Promise<void> {
  const platform = new MacosPlatform();
  platform.lifecycle.hideWindowSurface();
  const settings = await readSettings(platform.settingsFilePath());
  const controller = new AgentController(platform, settings);
  const binary = platform.helperBinary();
  const helper = new HelperClient({
    spawnHelper: () =>
      spawn(binary.path, [...binary.args], {
        stdio: ["pipe", "pipe", "inherit"],
      }),
    requestTimeoutMs: HELPER_REQUEST_TIMEOUT_MS,
    restartDelaysMs: HELPER_RESTART_DELAYS_MS,
    onEvent: (event) => controller.handleHelperEvent(event),
  });
  const mainWindow = new MainWindow(platform.lifecycle);
  const tray = new AgentTray({
    openWindow: () => mainWindow.show(),
    quit: () => app.quit(),
  });

  tray.render(controller.state());
  controller.onChange((state) => tray.render(state));
  registerBridge(controller, platform, mainWindow);
  powerMonitor.on("lock-screen", () => controller.setScreenLocked(true));
  powerMonitor.on("unlock-screen", () => controller.setScreenLocked(false));
  app.on("second-instance", () => mainWindow.show());
  app.on("before-quit", () => {
    controller.stopPermissionPolling();
    helper.stop();
  });

  helper.start();
  controller.startPermissionPolling();
  if (controller.state().onboardingStep !== "done") mainWindow.show();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("window-all-closed", () => undefined);
  void app.whenReady().then(startAgent);
}
