import type { ApiClient } from "@getahoy/lib";
import { BrowserWindow } from "electron";
import { historyChannels } from "../../core/appState/historyBridge.ts";
import { failureReasonOf } from "../../core/commands/outcomeDetails.ts";
import { finishedEntry } from "../../core/history/finishedEntry.ts";
import type { CommandReceiver } from "../commands/commandReceiver.ts";
import type { Turn } from "../commands/commandTurns.ts";
import type { IdentityStore } from "../identity/identityStore.ts";
import { createHistoryApi } from "./historyApi.ts";
import { registerHistoryBridge } from "./historyIpc.ts";
import { createLocalRun } from "./runLocally.ts";

const REMEMBERED_THREADS = 50;

type WiringOptions = {
  api: ApiClient;
  identity: IdentityStore;
  macName: string;
};

export type FinishedListener = (
  turn: Turn,
  owner: object,
  heard: string | null,
) => void;

// A follow-up answer carries its own words; the thread keeps the words that started it.
function rememberHeard(
  heard: Map<string, string>,
  thread: string,
  text: string,
) {
  if (heard.has(thread)) return;
  heard.set(thread, text);
  for (const oldest of heard.keys()) {
    if (heard.size <= REMEMBERED_THREADS) break;
    heard.delete(oldest);
  }
}

export function createHistoryWiring(options: WiringOptions) {
  const { api, identity, macName } = options;
  const heardByThread = new Map<string, string>();
  const silent = new Set<object>();

  const finished: FinishedListener = (turn, owner, heard) => {
    if (silent.has(owner)) return;
    if (heard) rememberHeard(heardByThread, turn.threadId, heard);
    const original = heardByThread.get(turn.threadId);
    if (!original) return;
    const entry = finishedEntry({
      threadId: turn.threadId,
      heard: original,
      status: turn.status,
      message: turn.message,
      round: turn.round,
      app: turn.app ?? null,
      via: turn.via ?? null,
      reason: failureReasonOf(turn) ?? null,
      onMacMs: turn.onMacMs ?? 0,
      mac: { key: identity.encodedPublicKey(), name: macName },
      at: Date.now(),
    });
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(historyChannels.finished, entry);
    }
  };

  const register = (commands: CommandReceiver) => {
    const local = createLocalRun(commands);
    silent.add(local.owner);
    registerHistoryBridge(createHistoryApi({ api, identity }), local.run);
  };

  return { finished, register };
}
