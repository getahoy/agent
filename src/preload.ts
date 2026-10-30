import { contextBridge, type IpcRendererEvent, ipcRenderer } from "electron";
import {
  type AgentBridge,
  bridgeChannels,
} from "./core/appState/agentBridge.ts";
import { type AgentState, agentStateSchema } from "./core/appState/appState.ts";

const invoke = async (channel: string, ...args: unknown[]) => {
  await ipcRenderer.invoke(channel, ...args);
};

const bridge: AgentBridge = {
  getState: async () =>
    agentStateSchema.parse(await ipcRenderer.invoke(bridgeChannels.getState)),
  onState: (listener: (state: AgentState) => void) => {
    const receive = (_event: IpcRendererEvent, payload: unknown) => {
      const parsed = agentStateSchema.safeParse(payload);
      if (parsed.success) listener(parsed.data);
    };
    ipcRenderer.on(bridgeChannels.state, receive);
    return () => ipcRenderer.removeListener(bridgeChannels.state, receive);
  },
  completeStep: (step) => invoke(bridgeChannels.completeStep, step),
  openPermissionSettings: (permission) =>
    invoke(bridgeChannels.openPermissionSettings, permission),
  relaunch: () => invoke(bridgeChannels.relaunch),
  startPairing: () => invoke(bridgeChannels.startPairing),
  stopPairing: () => invoke(bridgeChannels.stopPairing),
  unpairPhone: (publicKey) => invoke(bridgeChannels.unpairPhone, publicKey),
  signOut: () => invoke(bridgeChannels.signOut),
  requestNewPhone: () => invoke(bridgeChannels.requestNewPhone),
  cancelNewPhone: () => invoke(bridgeChannels.cancelNewPhone),
  finishPairing: () => invoke(bridgeChannels.finishPairing),
  dismissNotice: () => invoke(bridgeChannels.dismissNotice),
  setLanEnabled: (enabled) => invoke(bridgeChannels.setLanEnabled, enabled),
  openWindow: () => invoke(bridgeChannels.openWindow),
  quit: () => invoke(bridgeChannels.quit),
};

contextBridge.exposeInMainWorld("ahoy", bridge);
