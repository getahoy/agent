import { bytes32Schema } from "@getahoy/protocol";
import { ipcMain } from "electron";
import { z } from "zod";
import {
  bridgeChannels,
  permissionSchema,
} from "../core/appState/agentBridge.ts";
import { onboardingStepSchema } from "../core/appState/appState.ts";
import type { PlatformAdapter } from "../ports/platform.ts";
import type { AgentController } from "./agentController.ts";
import type { MainWindow } from "./mainWindow.ts";
import type { PairingServices } from "./pairing/pairingServices.ts";

type BridgeParts = {
  controller: AgentController;
  platform: PlatformAdapter;
  mainWindow: MainWindow;
  services: PairingServices;
  setLanEnabled: (enabled: boolean) => Promise<void>;
};

function handleParsed<T>(
  channel: string,
  schema: z.ZodType<T>,
  work: (input: T) => unknown,
): void {
  ipcMain.handle(channel, async (_event, input: unknown) => {
    const parsed = schema.safeParse(input);
    if (parsed.success) await work(parsed.data);
  });
}

function registerPairing({ controller, services, setLanEnabled }: BridgeParts) {
  const { pairing } = services;
  ipcMain.handle(bridgeChannels.startPairing, () => pairing.start());
  ipcMain.handle(bridgeChannels.stopPairing, () => pairing.stop());
  ipcMain.handle(bridgeChannels.signOut, () => services.signOut());
  ipcMain.handle(bridgeChannels.requestNewPhone, () =>
    controller.setPairingNewPhone(true),
  );
  ipcMain.handle(bridgeChannels.cancelNewPhone, () => {
    pairing.stop();
    controller.setPairingNewPhone(false);
  });
  ipcMain.handle(bridgeChannels.finishPairing, () =>
    controller.finishPairing(),
  );
  ipcMain.handle(bridgeChannels.dismissNotice, () =>
    controller.dismissEndedNotice(),
  );
  handleParsed(bridgeChannels.unpairPhone, bytes32Schema, services.unpairPhone);
  handleParsed(bridgeChannels.setLanEnabled, z.boolean(), setLanEnabled);
}

export function registerBridge(parts: BridgeParts): void {
  const { controller, platform, mainWindow } = parts;
  ipcMain.handle(bridgeChannels.getState, () => controller.state());
  handleParsed(bridgeChannels.completeStep, onboardingStepSchema, (step) =>
    controller.completeStep(step),
  );
  handleParsed(bridgeChannels.openPermissionSettings, permissionSchema, (p) =>
    platform.permissions.openSettings(p),
  );
  ipcMain.handle(bridgeChannels.relaunch, () => platform.lifecycle.relaunch());
  registerPairing(parts);
  controller.onChange((state) => mainWindow.send(bridgeChannels.state, state));
}
