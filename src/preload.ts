import { contextBridge, type IpcRendererEvent, ipcRenderer } from "electron";
import type { z } from "zod";
import {
  type AgentBridge,
  bridgeChannels,
} from "./core/appState/agentBridge.ts";
import { type AgentState, agentStateSchema } from "./core/appState/appState.ts";
import {
  type HistoryBridge,
  historyChannels,
  historyReplies,
} from "./core/appState/historyBridge.ts";

const invoke = async (channel: string, ...args: unknown[]) => {
  await ipcRenderer.invoke(channel, ...args);
};

const FAILED = { kind: "failed", failure: "refused" } as const;

async function ask<T>(schema: z.ZodType<T>, channel: string, input?: unknown) {
  const parsed = schema.safeParse(await ipcRenderer.invoke(channel, input));
  return parsed.success ? parsed.data : FAILED;
}

const history: HistoryBridge = {
  loadHistory: (query) => ask(historyReplies.page, historyChannels.list, query),
  removeHistoryEntry: (id) =>
    ask(historyReplies.changed, historyChannels.remove, id),
  restoreHistoryEntry: (id) =>
    ask(historyReplies.changed, historyChannels.restore, id),
  clearHistory: () => ask(historyReplies.changed, historyChannels.clear),
  historySettings: () => ask(historyReplies.settings, historyChannels.settings),
  changeHistorySettings: (keep) =>
    ask(historyReplies.settings, historyChannels.changeSettings, keep),
  runHistoryAgain: (heard) =>
    ask(historyReplies.ranAgain, historyChannels.runAgain, heard),
  reportHistoryProblem: (input) =>
    ask(historyReplies.changed, historyChannels.report, input),
};

const bridge: AgentBridge = {
  ...history,
  getState: async () =>
    agentStateSchema.parse(await ipcRenderer.invoke(bridgeChannels.getState)),
  onState: (listener: (state: AgentState) => void) => {
    const receive = (_event: IpcRendererEvent, payload: unknown) => {
      const parsed = agentStateSchema.safeParse(payload);
      if (parsed.success) listener(parsed.data);
      else {
        const issues = JSON.stringify(parsed.error.issues);
        ipcRenderer.send(bridgeChannels.devLog, "preload", issues);
      }
    };
    ipcRenderer.on(bridgeChannels.state, receive);
    return () => ipcRenderer.removeListener(bridgeChannels.state, receive);
  },
  completeStep: (step) => invoke(bridgeChannels.completeStep, step),
  openPermissionSettings: (permission) =>
    invoke(bridgeChannels.openPermissionSettings, permission),
  relaunch: () => invoke(bridgeChannels.relaunch),
  startPairing: () => invoke(bridgeChannels.startPairing),
  unpairPhone: (publicKey) => invoke(bridgeChannels.unpairPhone, publicKey),
  signOut: () => invoke(bridgeChannels.signOut),
  requestNewPhone: () => invoke(bridgeChannels.requestNewPhone),
  cancelNewPhone: () => invoke(bridgeChannels.cancelNewPhone),
  finishPairing: () => invoke(bridgeChannels.finishPairing),
  turnOn: () => invoke(bridgeChannels.turnOn),
  turnOff: (duration) => invoke(bridgeChannels.turnOff, duration),
  openWindow: () => invoke(bridgeChannels.openWindow),
  quit: () => invoke(bridgeChannels.quit),
  setPopoverHeight: (height) => invoke(bridgeChannels.setPopoverHeight, height),
  devLog: (scope, message) =>
    ipcRenderer.send(bridgeChannels.devLog, scope, message),
};

contextBridge.exposeInMainWorld("ahoy", bridge);
