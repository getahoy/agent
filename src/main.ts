import { spawn } from "node:child_process";
import { createLogger } from "@getahoy/lib";
import { app, Notification, powerMonitor } from "electron";
import { agentCopy } from "./copy/agentCopy.ts";
import { HelperClient } from "./core/helper/helperClient.ts";
import { parseAgentEnv } from "./env/agentEnv.ts";
import { macosMenubarIcon } from "./platform/macos/macosDevice.ts";
import { MacosPlatform } from "./platform/macos/macosPlatform.ts";
import type { PlatformAdapter } from "./ports/platform.ts";
import { AgentController } from "./shell/agentController.ts";
import { AgentTray } from "./shell/agentTray.ts";
import { registerBridge } from "./shell/bridgeIpc.ts";
import { IdentityStore } from "./shell/identity/identityStore.ts";
import { MainWindow } from "./shell/mainWindow.ts";
import {
  createPairingServices,
  type PairingServices,
} from "./shell/pairing/pairingServices.ts";
import { readSettings } from "./shell/settingsStore.ts";

const HELPER_REQUEST_TIMEOUT_MS = 10_000;
const HELPER_RESTART_DELAYS_MS = [250, 1000, 5000] as const;
const GOODBYE_FLUSH_MS = 150;
const LAN_PORT = 7421;

type ShellParts = {
  platform: PlatformAdapter;
  controller: AgentController;
  helper: HelperClient;
  services: PairingServices;
};

function createHelper(platform: PlatformAdapter, controller: AgentController) {
  const binary = platform.helperBinary();
  return new HelperClient({
    spawnHelper: () =>
      spawn(binary.path, [...binary.args], {
        stdio: ["pipe", "pipe", "inherit"],
      }),
    requestTimeoutMs: HELPER_REQUEST_TIMEOUT_MS,
    restartDelaysMs: HELPER_RESTART_DELAYS_MS,
    onEvent: (event) => controller.handleHelperEvent(event),
  });
}

function announceMenubarWhenOnboarded(
  controller: AgentController,
  mainWindow: MainWindow,
): void {
  let wasDone = controller.state().onboardingStep === "done";
  controller.onChange((state) => {
    const done = state.onboardingStep === "done";
    if (done && !wasDone) {
      mainWindow.close();
      const title = agentCopy["notification.title"];
      new Notification({ title, body: agentCopy["notification.body"] }).show();
    }
    wasDone = done;
  });
}

function watchPower({ controller, services }: ShellParts): void {
  const { phoneLink, monitor } = services;
  const setLocked = (locked: boolean) => {
    controller.setScreenLocked(locked);
    phoneLink.broadcastStatus(locked);
  };
  powerMonitor.on("lock-screen", () => setLocked(true));
  powerMonitor.on("unlock-screen", () => setLocked(false));
  powerMonitor.on("suspend", () => phoneLink.endAll("sleeping"));
  powerMonitor.on("resume", () => void monitor.check());
}

function quitAfterGoodbye({ controller, helper, services }: ShellParts): void {
  let goodbyeSent = false;
  app.on("before-quit", (event) => {
    if (!goodbyeSent) {
      goodbyeSent = true;
      event.preventDefault();
      services.phoneLink.endAll("quitting");
      setTimeout(() => app.quit(), GOODBYE_FLUSH_MS);
      return;
    }
    controller.stopPermissionPolling();
    services.pairing.stop();
    services.monitor.stop();
    services.phoneLink.stop();
    helper.stop();
  });
}

function wireShell(parts: ShellParts): MainWindow {
  const { platform, controller, services } = parts;
  const { phoneLink, pairing } = services;
  const mainWindow = new MainWindow(platform.lifecycle, () => pairing.stop());
  const setLanEnabled = async (enabled: boolean) => {
    if (!enabled) phoneLink.endAll("turned_off");
    await controller.setLanEnabled(enabled);
    if (enabled) phoneLink.start();
    else phoneLink.stop();
  };
  const tray = new AgentTray({
    menubarIcon: macosMenubarIcon,
    openWindow: () => mainWindow.show(),
    setLanEnabled: (enabled) => void setLanEnabled(enabled),
    quit: () => app.quit(),
  });
  tray.render(controller.state());
  controller.onChange((state) => tray.render(state));
  registerBridge({ controller, platform, mainWindow, services, setLanEnabled });
  announceMenubarWhenOnboarded(controller, mainWindow);
  watchPower(parts);
  quitAfterGoodbye(parts);
  app.on("second-instance", () => mainWindow.show());
  app.on("activate", () => mainWindow.show());
  return mainWindow;
}

async function startAgent(): Promise<void> {
  const env = parseAgentEnv();
  const logger = createLogger();
  const platform = new MacosPlatform();
  platform.lifecycle.hideWindowSurface();
  const settings = await readSettings(platform.settingsFilePath());
  const identityFile = platform.identityFilePath();
  const identity = await IdentityStore.open(identityFile, logger);
  const device = await platform.deviceIdentity();
  const pairedPhones = identity.pairedPhones();
  const controller = new AgentController(platform, settings, pairedPhones);
  const helper = createHelper(platform, controller);
  const services = createPairingServices({
    apiUrl: env.VITE_AHOY_API_URL,
    port: LAN_PORT,
    logger,
    identity,
    device,
    controller,
  });
  const mainWindow = wireShell({ platform, controller, helper, services });
  helper.start();
  controller.startPermissionPolling();
  services.monitor.start();
  if (settings.lanEnabled) services.phoneLink.start();
  if (!app.getLoginItemSettings().wasOpenedAtLogin) mainWindow.show();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("window-all-closed", () => undefined);
  void app.whenReady().then(startAgent);
}
