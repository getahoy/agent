import {
  COMMAND_STATUSES,
  type HistoryEntry,
  type HistoryPage,
  type HistorySettings,
  historyChangedSchema,
  historyPageSchema,
  historyQuerySchema,
  historySettingsSchema,
  MAX_REPORT_NOTE_CHARS,
} from "@getahoy/protocol";
import { z } from "zod";

export const historyChannels = {
  list: "history:list",
  remove: "history:delete",
  restore: "history:restore",
  clear: "history:clear",
  settings: "history:settings",
  changeSettings: "history:change-settings",
  runAgain: "history:run-again",
  report: "history:report",
  finished: "history:finished",
} as const;

const ranAgainSchema = z.object({
  status: z.enum(COMMAND_STATUSES),
  message: z.string(),
});

export type RanAgain = z.infer<typeof ranAgainSchema>;

export const reportInputSchema = z.object({
  id: z.uuid(),
  note: z.string().max(MAX_REPORT_NOTE_CHARS),
});

export type ReportInput = z.infer<typeof reportInputSchema>;

export const macHistoryQuerySchema = historyQuerySchema.omit({ macKey: true });

export type MacHistoryQuery = z.infer<typeof macHistoryQuerySchema>;

const HISTORY_FAILURES = ["signedOut", "unreachable", "refused"] as const;

export type HistoryFailure = (typeof HISTORY_FAILURES)[number];

export type HistoryReply<T> =
  | { kind: "ok"; data: T }
  | { kind: "failed"; failure: HistoryFailure };

function historyReplySchema<T>(schema: z.ZodType<T>) {
  return z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("ok"), data: schema }),
    z.object({ kind: z.literal("failed"), failure: z.enum(HISTORY_FAILURES) }),
  ]);
}

export const historyReplies = {
  page: historyReplySchema(historyPageSchema),
  changed: historyReplySchema(historyChangedSchema),
  settings: historyReplySchema(historySettingsSchema),
  ranAgain: historyReplySchema(ranAgainSchema),
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
  runHistoryAgain: (heard: string) => Promise<HistoryReply<RanAgain>>;
  reportHistoryProblem: (input: ReportInput) => Promise<HistoryReply<Changed>>;
  onHistoryFinished: (listener: (entry: HistoryEntry) => void) => () => void;
};
