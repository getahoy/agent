import {
  type HistoryPage,
  type HistorySettings,
  historyChangedSchema,
  historyPageSchema,
  historyQuerySchema,
  historySettingsSchema,
} from "@getahoy/protocol";
import { z } from "zod";

export const historyChannels = {
  list: "history:list",
  remove: "history:delete",
  restore: "history:restore",
  clear: "history:clear",
  settings: "history:settings",
  changeSettings: "history:change-settings",
} as const;

export const macHistoryQuerySchema = historyQuerySchema.omit({ macKey: true });

export type MacHistoryQuery = z.infer<typeof macHistoryQuerySchema>;

export const HISTORY_FAILURES = [
  "signedOut",
  "unreachable",
  "refused",
] as const;

export type HistoryFailure = (typeof HISTORY_FAILURES)[number];

export type HistoryReply<T> =
  | { kind: "ok"; data: T }
  | { kind: "failed"; failure: HistoryFailure };

export function historyReplySchema<T>(schema: z.ZodType<T>) {
  return z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("ok"), data: schema }),
    z.object({ kind: z.literal("failed"), failure: z.enum(HISTORY_FAILURES) }),
  ]);
}

export const historyReplies = {
  page: historyReplySchema(historyPageSchema),
  changed: historyReplySchema(historyChangedSchema),
  settings: historyReplySchema(historySettingsSchema),
};

type Changed = z.infer<typeof historyChangedSchema>;

export type HistoryBridge = {
  loadHistory: (query: MacHistoryQuery) => Promise<HistoryReply<HistoryPage>>;
  removeHistoryEntry: (id: string) => Promise<HistoryReply<Changed>>;
  restoreHistoryEntry: (id: string) => Promise<HistoryReply<Changed>>;
  clearHistory: () => Promise<HistoryReply<Changed>>;
  historySettings: () => Promise<HistoryReply<HistorySettings>>;
  changeHistorySettings: (
    keepHistory: boolean,
  ) => Promise<HistoryReply<HistorySettings>>;
};
