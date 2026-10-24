import { contextBridge, type IpcRendererEvent, ipcRenderer } from "electron";
import {
  type AgentBridge,
  bridgeChannels,
} from "./core/appState/agentBridge.ts";
import { type AgentState, agentStateSchema } from "./core/appState/appState.ts";

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
  completeStep: async (step) => {
    await ipcRenderer.invoke(bridgeChannels.completeStep, step);
  },
  openPermissionSettings: async (permission) => {
    await ipcRenderer.invoke(bridgeChannels.openPermissionSettings, permission);
  },
  relaunch: async () => {
    await ipcRenderer.invoke(bridgeChannels.relaunch);
  },
  startPairing: async () => {
    await ipcRenderer.invoke(bridgeChannels.startPairing);
  },
  stopPairing: async () => {
    await ipcRenderer.invoke(bridgeChannels.stopPairing);
  },
  unpairPhone: async (publicKey) => {
    await ipcRenderer.invoke(bridgeChannels.unpairPhone, publicKey);
  },
};

contextBridge.exposeInMainWorld("ahoy", bridge);
