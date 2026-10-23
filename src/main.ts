import { spawn } from "node:child_process";
import { createLogger, type Logger } from "@getahoy/lib";
import {
  type DeviceDescription,
  type Hello,
  PROTOCOL_VERSION,
} from "@getahoy/protocol";
import { app, Notification, powerMonitor } from "electron";
import { agentCopy } from "./copy/agentCopy.ts";
import { HelperClient } from "./core/helper/helperClient.ts";
import { type AgentEnv, parseAgentEnv } from "./env/agentEnv.ts";
import { macosMenubarIcon } from "./platform/macos/macosDevice.ts";
import { MacosPlatform } from "./platform/macos/macosPlatform.ts";
import type { DeviceIdentity, PlatformAdapter } from "./ports/platform.ts";
import { AgentController } from "./shell/agentController.ts";
import { AgentTray } from "./shell/agentTray.ts";
import { registerBridge } from "./shell/bridgeIpc.ts";
import { IdentityStore } from "./shell/identity/identityStore.ts";
import { lanEndpoint } from "./shell/lan/lanAddresses.ts";
import { PhoneLink } from "./shell/lan/phoneLink.ts";
import { MainWindow } from "./shell/mainWindow.ts";
import { createDeviceAuthClient } from "./shell/pairing/deviceFlow.ts";
import { PairingSession } from "./shell/pairing/pairingSession.ts";
import { readSettings } from "./shell/settingsStore.ts";

const HELPER_REQUEST_TIMEOUT_MS = 10_000;
const HELPER_RESTART_DELAYS_MS = [250, 1000, 5000] as const;
const LAN_PORT = 7421;

type LinkParts = {
  env: AgentEnv;
  logger: Logger;
  identity: IdentityStore;
  device: DeviceIdentity;
  controller: AgentController;
};

type ShellParts = {
  platform: PlatformAdapter;
  controller: AgentController;
  helper: HelperClient;
  phoneLink: PhoneLink;
  pairing: PairingSession;
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

function localHello(device: DeviceIdentity): Hello {
  return {
    protocolVersion: PROTOCOL_VERSION,
    platform: device.platform,
    appVersion: app.getVersion(),
    capabilities: [...device.capabilities],
  };
}

function desktopDescription(
  identity: IdentityStore,
  device: DeviceIdentity,
): DeviceDescription {
  return {
    ...localHello(device),
    publicKey: identity.encodedPublicKey(),
    displayName: device.displayName,
    platformVersion: device.platformVersion,
  };
}

function createLinks({ env, logger, identity, device, controller }: LinkParts) {
  const phoneLink = new PhoneLink({
    port: LAN_PORT,
    identity,
    localHello: localHello(device),
    logger,
    onConnectedPhones: (phones) => controller.setConnectedPhones(phones),
  });
  const apiUrl = env.VITE_AHOY_API_URL;
  const pairing = new PairingSession({
    apiUrl,
    authClient: createDeviceAuthClient(apiUrl),
    identity,
    device: () => desktopDescription(identity, device),
    lanEndpoint: () => lanEndpoint(LAN_PORT),
    lanListening: () => controller.state().lanEnabled,
    logger,
    onStatus: (status) =>
      controller.setPairing(status, identity.pairedPhones()),
  });
  return { phoneLink, pairing };
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

function wireShell(parts: ShellParts): MainWindow {
  const { platform, controller, helper, phoneLink, pairing } = parts;
  const mainWindow = new MainWindow(platform.lifecycle, () => pairing.stop());
  const setLanEnabled = async (enabled: boolean) => {
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
  registerBridge({ controller, platform, mainWindow, pairing });
  announceMenubarWhenOnboarded(controller, mainWindow);
  powerMonitor.on("lock-screen", () => controller.setScreenLocked(true));
  powerMonitor.on("unlock-screen", () => controller.setScreenLocked(false));
  app.on("second-instance", () => mainWindow.show());
  app.on("before-quit", () => {
    controller.stopPermissionPolling();
    pairing.stop();
    phoneLink.stop();
    helper.stop();
  });
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
  const linkParts = { env, logger, identity, device, controller };
  const { phoneLink, pairing } = createLinks(linkParts);
  const shellParts = { platform, controller, helper, phoneLink, pairing };
  const mainWindow = wireShell(shellParts);
  helper.start();
  controller.startPermissionPolling();
  if (settings.lanEnabled) phoneLink.start();
  if (settings.onboardingStep !== "done") mainWindow.show();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("window-all-closed", () => undefined);
  void app.whenReady().then(startAgent);
}
