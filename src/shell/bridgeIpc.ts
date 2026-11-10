import type { Logger } from "@getahoy/lib";
import { bytes32Schema } from "@getahoy/protocol";
import { app, BrowserWindow, ipcMain } from "electron";
import type { z } from "zod";
import {
  bridgeChannels,
  permissionSchema,
  popoverHeightSchema,
} from "../core/appState/agentBridge.ts";
import { onboardingStepSchema } from "../core/appState/appState.ts";
import { offDurationSchema } from "../core/appState/listenOff.ts";
import type { PlatformAdapter } from "../ports/platform.ts";
import type { AgentController } from "./agentController.ts";
import { registerAppearance } from "./appearanceIpc.ts";
import type { ListenSwitch } from "./lan/listenSwitch.ts";
import type { PairingServices } from "./pairing/pairingServices.ts";
import { fromOwnRenderer } from "./rendererGuard.ts";

type BridgeParts = {
  controller: AgentController;
  logger: Logger;
  platform: PlatformAdapter;
  services: PairingServices;
  listen: ListenSwitch;
  startPairing: () => void;
  openWindow: () => void;
  setPopoverHeight: (height: number) => void;
};

function handle(channel: string, work: (input: unknown) => unknown): void {
  ipcMain.handle(channel, (event, input: unknown) => {
    if (!fromOwnRenderer(event)) return undefined;
    return work(input);
  });
}

function handleParsed<T>(
  channel: string,
  schema: z.ZodType<T>,
  work: (input: T) => unknown,
): void {
  handle(channel, async (input) => {
    const parsed = schema.safeParse(input);
    if (parsed.success) await work(parsed.data);
  });
}

function registerPairing(parts: BridgeParts) {
  const { controller, services, listen } = parts;
  const { pairing } = services;
  handle(bridgeChannels.startPairing, () => parts.startPairing());
  handle(bridgeChannels.signOut, () => services.signOut());
  handle(bridgeChannels.requestNewPhone, () =>
    controller.setPairingNewPhone(true),
  );
  handle(bridgeChannels.cancelNewPhone, () => {
    pairing.stop();
    controller.setPairingNewPhone(false);
  });
  handle(bridgeChannels.finishPairing, () => controller.finishPairing());
  handleParsed(bridgeChannels.unpairPhone, bytes32Schema, services.unpairPhone);
  handle(bridgeChannels.turnOn, () => listen.turnOn());
  handleParsed(bridgeChannels.turnOff, offDurationSchema, (duration) =>
    listen.turnOff(duration),
  );
}

export function registerBridge(parts: BridgeParts): void {
  const { controller, platform } = parts;
  handle(bridgeChannels.getState, () => controller.state());
  handleParsed(bridgeChannels.completeStep, onboardingStepSchema, (step) =>
    controller.completeStep(step),
  );
  handleParsed(bridgeChannels.openPermissionSettings, permissionSchema, (p) =>
    platform.permissions.openSettings(p),
  );
  handle(bridgeChannels.relaunch, () => platform.lifecycle.relaunch());
  handle(bridgeChannels.openWindow, () => parts.openWindow());
  handle(bridgeChannels.quit, () => app.quit());
  handleParsed(
    bridgeChannels.setPopoverHeight,
    popoverHeightSchema,
    parts.setPopoverHeight,
  );
  registerPairing(parts);
  registerAppearance(controller, parts.logger);
  ipcMain.on(bridgeChannels.devLog, (event, scope: unknown, text: unknown) => {
    if (app.isPackaged || !fromOwnRenderer(event)) return;
    parts.logger.info(`renderer.${String(scope)}`, String(text));
  });
  controller.onChange((state) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(bridgeChannels.state, state);
    }
  });
}
