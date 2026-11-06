import { ipcMain } from "electron";
import { z } from "zod";
import {
  type HistoryReply,
  historyChannels,
  macHistoryQuerySchema,
} from "../../core/appState/historyBridge.ts";
import { fromOwnRenderer } from "../rendererGuard.ts";
import type { HistoryApi } from "./historyApi.ts";

const REFUSED: HistoryReply<never> = { kind: "failed", failure: "refused" };
const entryIdSchema = z.uuid();

function answer<T>(
  channel: string,
  schema: z.ZodType<T>,
  work: (input: T) => Promise<unknown>,
): void {
  ipcMain.handle(channel, (event, input: unknown) => {
    if (!fromOwnRenderer(event)) return REFUSED;
    const parsed = schema.safeParse(input);
    return parsed.success ? work(parsed.data) : REFUSED;
  });
}

const nothing = z.undefined();

export function registerHistoryBridge(api: HistoryApi): void {
  answer(historyChannels.list, macHistoryQuerySchema, api.list);
  answer(historyChannels.remove, entryIdSchema, api.remove);
  answer(historyChannels.restore, entryIdSchema, api.restore);
  answer(historyChannels.clear, nothing, api.clear);
  answer(historyChannels.settings, nothing, api.settings);
  answer(historyChannels.changeSettings, z.boolean(), api.changeSettings);
}
