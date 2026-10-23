import { ipcMain } from "electron";
import {
  bridgeChannels,
  permissionSchema,
} from "../core/appState/agentBridge.ts";
import { onboardingStepSchema } from "../core/appState/appState.ts";
import type { PlatformAdapter } from "../ports/platform.ts";
import type { AgentController } from "./agentController.ts";
import type { MainWindow } from "./mainWindow.ts";
import type { PairingSession } from "./pairing/pairingSession.ts";

type BridgeParts = {
  controller: AgentController;
  platform: PlatformAdapter;
  mainWindow: MainWindow;
  pairing: PairingSession;
};

export function registerBridge(parts: BridgeParts): void {
  const { controller, platform, mainWindow, pairing } = parts;
  ipcMain.handle(bridgeChannels.getState, () => controller.state());
  ipcMain.handle(bridgeChannels.completeStep, async (_event, step: unknown) => {
    const parsed = onboardingStepSchema.safeParse(step);
    if (parsed.success) await controller.completeStep(parsed.data);
  });
  ipcMain.handle(
    bridgeChannels.openPermissionSettings,
    async (_event, permission: unknown) => {
      const parsed = permissionSchema.safeParse(permission);
      if (parsed.success) await platform.permissions.openSettings(parsed.data);
    },
  );
  ipcMain.handle(bridgeChannels.relaunch, () => platform.lifecycle.relaunch());
  ipcMain.handle(bridgeChannels.startPairing, () => pairing.start());
  ipcMain.handle(bridgeChannels.stopPairing, () => pairing.stop());
  controller.onChange((state) => mainWindow.send(bridgeChannels.state, state));
}
