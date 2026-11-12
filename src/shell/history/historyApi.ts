import {
  type ApiClient,
  failureKind,
  historyCalls,
  type RequestError,
  type RequestResult,
} from "@getahoy/lib";
import type {
  HistoryFailure,
  HistoryReply,
  MacHistoryQuery,
  ReportInput,
} from "../../core/appState/historyBridge.ts";
import type { IdentityStore } from "../identity/identityStore.ts";

type HistoryApiOptions = { api: ApiClient; identity: IdentityStore };

const SIGNED_OUT = { kind: "failed", failure: "signedOut" } as const;

function failureOf(error: RequestError): HistoryFailure {
  const kind = failureKind(error);
  if (kind === "offline") return "unreachable";
  return kind === "signedOut" ? "signedOut" : "refused";
}

export function createHistoryApi({ api, identity }: HistoryApiOptions) {
  const calls = historyCalls(api.call);
  const reply = async <T>(
    send: () => Promise<RequestResult<T>>,
  ): Promise<HistoryReply<T>> => {
    if (!identity.sessionToken()) return SIGNED_OUT;
    const result = await send();
    if (result.code === "success") return { kind: "ok", data: result.data };
    return { kind: "failed", failure: failureOf(result.error) };
  };
  // This Mac only ever reads its own history, so its key is set here, never by the page.
  const list = (query: MacHistoryQuery) =>
    reply(() => calls.list({ ...query, macKey: identity.encodedPublicKey() }));
  return {
    list,
    report: ({ id, note }: ReportInput) => reply(() => calls.report(id, note)),
    remove: (id: string) => reply(() => calls.remove(id)),
    restore: (id: string) => reply(() => calls.restore(id)),
    clear: () => reply(() => calls.clear()),
    settings: () => reply(() => calls.settings()),
    changeSettings: (keepHistory: boolean) =>
      reply(() => calls.changeSettings(keepHistory)),
  };
}

export type HistoryApi = ReturnType<typeof createHistoryApi>;
