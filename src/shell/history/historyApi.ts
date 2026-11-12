import { type RequestError, request } from "@getahoy/lib";
import {
  apiPaths,
  historyChangedSchema,
  historyPageSchema,
  historySettingsSchema,
} from "@getahoy/protocol";
import type { z } from "zod";
import type {
  HistoryFailure,
  HistoryReply,
  MacHistoryQuery,
  ReportInput,
} from "../../core/appState/historyBridge.ts";
import type { IdentityStore } from "../identity/identityStore.ts";

type HistoryApiOptions = { apiUrl: string; identity: IdentityStore };

type Call<T> = {
  path: string;
  schema: z.ZodType<T>;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Readonly<Record<string, string>>;
};

function failureOf(error: RequestError): HistoryFailure {
  if (error.kind === "network") return "unreachable";
  const signedOut =
    error.kind === "api" && error.detail.code === "unauthorized";
  return signedOut ? "signedOut" : "refused";
}

function createCall({ apiUrl, identity }: HistoryApiOptions) {
  return async <T>(options: Call<T>): Promise<HistoryReply<T>> => {
    const token = identity.sessionToken();
    if (!token) return { kind: "failed", failure: "signedOut" };
    const url = new URL(options.path, apiUrl);
    for (const [name, text] of Object.entries(options.query ?? {})) {
      url.searchParams.set(name, text);
    }
    const answer = await request({
      url: url.toString(),
      method: options.method ?? "GET",
      ...(options.body === undefined ? {} : { body: options.body }),
      headers: { authorization: `Bearer ${token}` },
      schema: options.schema,
    });
    if (answer.code === "success") return { kind: "ok", data: answer.data };
    return { kind: "failed", failure: failureOf(answer.error) };
  };
}

const changed = historyChangedSchema;
const settings = historySettingsSchema;

export function createHistoryApi(options: HistoryApiOptions) {
  const call = createCall(options);
  // This Mac only ever reads its own history, so its key is set here, never by the page.
  const list = (query: MacHistoryQuery) => {
    const macKey = options.identity.encodedPublicKey();
    const schema = historyPageSchema;
    if (query.q) {
      const body = { ...query, macKey };
      const path = apiPaths.historySearch;
      return call({ path, method: "POST", body, schema });
    }
    const { status, cursor } = query;
    const params = { status, macKey, ...(cursor ? { cursor } : {}) };
    return call({ path: apiPaths.history, query: params, schema });
  };
  const report = ({ id, note }: ReportInput) => {
    const body = note.trim() ? { note: note.trim() } : {};
    const path = apiPaths.historyReport(id);
    return call({ path, method: "POST", body, schema: changed });
  };
  return {
    list,
    report,
    remove: (id: string) =>
      call({
        path: apiPaths.historyEntry(id),
        method: "DELETE",
        schema: changed,
      }),
    restore: (id: string) =>
      call({
        path: apiPaths.historyRestore(id),
        method: "POST",
        schema: changed,
      }),
    clear: () =>
      call({ path: apiPaths.history, method: "DELETE", schema: changed }),
    settings: () => call({ path: apiPaths.historySettings, schema: settings }),
    changeSettings: (keepHistory: boolean) =>
      call({
        path: apiPaths.historySettings,
        method: "PATCH",
        body: { keepHistory },
        schema: settings,
      }),
  };
}

export type HistoryApi = ReturnType<typeof createHistoryApi>;
