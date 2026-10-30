import { spawn } from "node:child_process";
import { createLogger, type Logger } from "@getahoy/lib";
import { app, powerMonitor } from "electron";
import { HelperClient } from "./core/helper/helperClient.ts";
import type { HelperEvent } from "./core/helper/helperProtocol.ts";
import { parseAgentEnv } from "./env/agentEnv.ts";
import { MacosPlatform } from "./platform/macos/macosPlatform.ts";
import type { PlatformAdapter } from "./ports/platform.ts";
import { AgentController } from "./shell/agentController.ts";
import { ChoiceBook } from "./shell/commands/choiceBook.ts";
import { CommandReceiver } from "./shell/commands/commandReceiver.ts";
import { createCommandRunner } from "./shell/commands/commandRunner.ts";
import { IdentityStore } from "./shell/identity/identityStore.ts";
import { createInterpreter } from "./shell/interpret/interpretApi.ts";
import type { MainWindow } from "./shell/mainWindow.ts";
import {
  createPairingServices,
  type PairingServices,
} from "./shell/pairing/pairingServices.ts";
import { readSettings, type Settings } from "./shell/settingsStore.ts";
import { createSurfaces } from "./shell/shellSurfaces.ts";
import { MacVoice } from "./shell/voice/macVoice.ts";

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

function createHelper(
  platform: PlatformAdapter,
  onEvent: (event: HelperEvent) => void,
) {
  const binary = platform.helperBinary();
  return new HelperClient({
    spawnHelper: () =>
      spawn(binary.path, [...binary.args], {
        stdio: ["pipe", "pipe", "inherit"],
      }),
    requestTimeoutMs: HELPER_REQUEST_TIMEOUT_MS,
    restartDelaysMs: HELPER_RESTART_DELAYS_MS,
    onEvent,
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
  const mainWindow = createSurfaces(parts);
  watchPower(parts);
  quitAfterGoodbye(parts);
  app.on("second-instance", () => mainWindow.show());
  app.on("activate", () => mainWindow.show());
  return mainWindow;
}

type CommandParts = {
  platform: PlatformAdapter;
  controller: AgentController;
  settings: Settings;
  identity: IdentityStore;
  apiUrl: string;
  logger: Logger;
};

function createCommands(parts: CommandParts) {
  const { platform, controller, settings, identity, apiUrl, logger } = parts;
  const helper = createHelper(platform, (event) => {
    controller.handleHelperEvent(event);
    if (event === "frontWindowChanged") choices.expire();
  });
  const choices = new ChoiceBook({
    clearOverlay: () => void helper.request("overlay", { marks: [] }),
  });
  const interpret = createInterpreter({ apiUrl, identity });
  const { blockedApps } = settings;
  const isLocked = () => controller.state().screenLocked;
  const voice = new MacVoice({ apiUrl, identity, isLocked, logger });
  const commands = new CommandReceiver({
    isLocked,
    run: createCommandRunner({ helper, interpret, blockedApps, logger }),
    onHeard: (text) => controller.showLastHeard(text),
    onResult: (turn, owner) => voice.speakTurn(turn, owner),
    onStopSpeech: (owner) => voice.stop(owner),
    choices,
    logger,
  });
  return { helper, commands };
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
  const apiUrl = env.VITE_AHOY_API_URL;
  const command = { platform, controller, settings, identity, apiUrl, logger };
  const { helper, commands } = createCommands(command);
  const services = createPairingServices({
    apiUrl,
    port: LAN_PORT,
    logger,
    identity,
    device,
    controller,
    commands,
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
