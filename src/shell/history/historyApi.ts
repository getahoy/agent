import { type RequestError, request } from "@getahoy/lib";
import {
  historyChangedSchema,
  historyPageSchema,
  historySettingsSchema,
} from "@getahoy/protocol";
import type { z } from "zod";
import type {
  HistoryFailure,
  HistoryReply,
  MacHistoryQuery,
} from "../../core/appState/historyBridge.ts";
import type { IdentityStore } from "../identity/identityStore.ts";

const HISTORY = "/api/history";

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

export function createHistoryApi({ apiUrl, identity }: HistoryApiOptions) {
  async function call<T>(options: Call<T>): Promise<HistoryReply<T>> {
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
  }

  // This Mac only ever reads its own history, so its key is set here, never by the page.
  function list(query: MacHistoryQuery) {
    const macKey = identity.encodedPublicKey();
    const schema = historyPageSchema;
    if (query.q) {
      const body = { ...query, macKey };
      return call({ path: `${HISTORY}/search`, method: "POST", body, schema });
    }
    const { status, cursor } = query;
    const params = { status, macKey, ...(cursor ? { cursor } : {}) };
    return call({ path: HISTORY, query: params, schema });
  }

  const entry = (id: string) => `${HISTORY}/${encodeURIComponent(id)}`;
  const changed = historyChangedSchema;
  const settings = historySettingsSchema;
  return {
    list,
    remove: (id: string) =>
      call({ path: entry(id), method: "DELETE", schema: changed }),
    restore: (id: string) =>
      call({ path: `${entry(id)}/restore`, method: "POST", schema: changed }),
    clear: () => call({ path: HISTORY, method: "DELETE", schema: changed }),
    settings: () => call({ path: `${HISTORY}/settings`, schema: settings }),
    changeSettings: (keepHistory: boolean) =>
      call({
        path: `${HISTORY}/settings`,
        method: "PATCH",
        body: { keepHistory },
        schema: settings,
      }),
  };
}

export type HistoryApi = ReturnType<typeof createHistoryApi>;
