import { MAX_COMMAND_TEXT_CHARS } from "@getahoy/protocol";
import { ipcMain } from "electron";
import { z } from "zod";
import {
  type HistoryReply,
  historyChannels,
  macHistoryQuerySchema,
  reportInputSchema,
} from "../../core/appState/historyBridge.ts";
import { fromOwnRenderer } from "../rendererGuard.ts";
import type { HistoryApi } from "./historyApi.ts";
import type { LocalRun } from "./runLocally.ts";

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
const heardSchema = z.string().min(1).max(MAX_COMMAND_TEXT_CHARS);

export function registerHistoryBridge(api: HistoryApi, runAgain: LocalRun) {
  answer(historyChannels.list, macHistoryQuerySchema, api.list);
  answer(historyChannels.runAgain, heardSchema, runAgain);
  answer(historyChannels.report, reportInputSchema, api.report);
  answer(historyChannels.remove, entryIdSchema, api.remove);
  answer(historyChannels.restore, entryIdSchema, api.restore);
  answer(historyChannels.clear, nothing, api.clear);
  answer(historyChannels.settings, nothing, api.settings);
  answer(historyChannels.changeSettings, z.boolean(), api.changeSettings);
}
