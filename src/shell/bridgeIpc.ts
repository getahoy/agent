import { bytes32Schema } from "@getahoy/protocol";
import { app, BrowserWindow, ipcMain } from "electron";
import { z } from "zod";
import {
  bridgeChannels,
  permissionSchema,
  popoverHeightSchema,
} from "../core/appState/agentBridge.ts";
import { onboardingStepSchema } from "../core/appState/appState.ts";
import type { PlatformAdapter } from "../ports/platform.ts";
import type { AgentController } from "./agentController.ts";
import type { PairingServices } from "./pairing/pairingServices.ts";

type BridgeParts = {
  controller: AgentController;
  platform: PlatformAdapter;
  services: PairingServices;
  setLanEnabled: (enabled: boolean) => Promise<void>;
  openWindow: () => void;
  setPopoverHeight: (height: number) => void;
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
  const { controller, platform } = parts;
  ipcMain.handle(bridgeChannels.getState, () => controller.state());
  handleParsed(bridgeChannels.completeStep, onboardingStepSchema, (step) =>
    controller.completeStep(step),
  );
  handleParsed(bridgeChannels.openPermissionSettings, permissionSchema, (p) =>
    platform.permissions.openSettings(p),
  );
  ipcMain.handle(bridgeChannels.relaunch, () => platform.lifecycle.relaunch());
  ipcMain.handle(bridgeChannels.openWindow, () => parts.openWindow());
  ipcMain.handle(bridgeChannels.quit, () => app.quit());
  handleParsed(
    bridgeChannels.setPopoverHeight,
    popoverHeightSchema,
    parts.setPopoverHeight,
  );
  registerPairing(parts);
  controller.onChange((state) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(bridgeChannels.state, state);
    }
  });
}
