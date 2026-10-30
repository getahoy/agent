import { app, Notification } from "electron";
import { agentCopy } from "../copy/agentCopy.ts";
import { macosMenubarIcon } from "../platform/macos/macosDevice.ts";
import type { PlatformAdapter } from "../ports/platform.ts";
import type { AgentController } from "./agentController.ts";
import { AgentTray } from "./agentTray.ts";
import { registerBridge } from "./bridgeIpc.ts";
import { MainWindow } from "./mainWindow.ts";
import type { PairingServices } from "./pairing/pairingServices.ts";
import { PopoverWindow } from "./popoverWindow.ts";

type SurfaceParts = {
  platform: PlatformAdapter;
  controller: AgentController;
  services: PairingServices;
};

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

function lanSwitch({ controller, services }: SurfaceParts) {
  const { phoneLink } = services;
  return async (enabled: boolean) => {
    if (!enabled) phoneLink.endAll("turned_off");
    await controller.setLanEnabled(enabled);
    if (enabled) phoneLink.start();
    else phoneLink.stop();
  };
}

export function createSurfaces(parts: SurfaceParts): MainWindow {
  const { platform, controller, services } = parts;
  const mainWindow = new MainWindow(platform.lifecycle, () =>
    services.pairing.stop(),
  );
  const popover = new PopoverWindow();
  const openWindow = () => {
    popover.hide();
    mainWindow.show();
  };
  const tray = new AgentTray({
    menubarIcon: macosMenubarIcon,
    togglePopover: (bounds) => popover.toggle(bounds),
    openWindow,
    quit: () => app.quit(),
    extraMenuItems: [],
  });
  tray.render(controller.state());
  controller.onChange((state) => tray.render(state));
  registerBridge({
    controller,
    platform,
    services,
    setLanEnabled: lanSwitch(parts),
    openWindow,
    setPopoverHeight: (height) => popover.setHeight(height),
  });
  announceMenubarWhenOnboarded(controller, mainWindow);
  return mainWindow;
}
