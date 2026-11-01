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
import { fromOwnRenderer } from "./rendererGuard.ts";

type BridgeParts = {
  controller: AgentController;
  platform: PlatformAdapter;
  services: PairingServices;
  setLanEnabled: (enabled: boolean) => Promise<void>;
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

function registerPairing({ controller, services, setLanEnabled }: BridgeParts) {
  const { pairing } = services;
  handle(bridgeChannels.startPairing, () => pairing.start());
  handle(bridgeChannels.stopPairing, () => pairing.stop());
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
  handleParsed(bridgeChannels.setLanEnabled, z.boolean(), setLanEnabled);
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
  controller.onChange((state) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(bridgeChannels.state, state);
    }
  });
}
