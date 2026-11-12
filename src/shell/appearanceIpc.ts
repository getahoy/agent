import {
  appearanceSchema,
  type Logger,
  type ResolvedTheme,
} from "@getahoy/lib";
import { ipcMain, nativeTheme } from "electron";
import { bridgeChannels } from "../core/appState/agentBridge.ts";
import type { AgentController } from "./agentController.ts";
import { fromOwnRenderer } from "./rendererGuard.ts";

function resolvedTheme(): ResolvedTheme {
  return nativeTheme.shouldUseDarkColors ? "dark" : "light";
}

export function registerAppearance(
  controller: AgentController,
  logger: Logger,
): void {
  // Sync, so the renderer starts from the stored choice before its first paint.
  ipcMain.on(bridgeChannels.appearance, (event) => {
    event.returnValue = fromOwnRenderer(event)
      ? controller.appearance()
      : "system";
  });
  ipcMain.handle(bridgeChannels.changeAppearance, async (event, input) => {
    const parsed = appearanceSchema.safeParse(input);
    if (!fromOwnRenderer(event) || !parsed.success) return resolvedTheme();
    nativeTheme.themeSource = parsed.data;
    await controller
      .setAppearance(parsed.data)
      .catch((error: unknown) =>
        logger.error("appearance", "could not save the appearance", error),
      );
    return resolvedTheme();
  });
}
