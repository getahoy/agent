import {
  type ApiClient,
  type FailureKind,
  failureKind,
  type RequestError,
} from "@getahoy/lib";
import {
  apiPaths,
  INTERPRET_ACTION_KINDS,
  type InterpretAction,
  interpretResponseSchema,
  MAX_INTERPRET_APPS,
} from "@getahoy/protocol";
import type { IdentityStore } from "../identity/identityStore.ts";

const INTERPRET_TIMEOUT_MS = 12_000;
const SIGNED_OUT = { kind: "failed", reason: "signedOut" } as const;

type InterpreterOptions = { api: ApiClient; identity: IdentityStore };

export type Interpretation =
  | { kind: "actions"; actions: InterpretAction[] }
  | { kind: "failed"; reason: FailureKind | "timedOut" };

// A dropped connection fails at once; a request that fails only after the whole wait timed out.
function failedAfter(answerError: RequestError, startedAt: number) {
  const reason = failureKind(answerError);
  const waited = Date.now() - startedAt >= INTERPRET_TIMEOUT_MS;
  return reason === "offline" && waited ? "timedOut" : reason;
}

export type Interpreter = (
  text: string,
  apps: readonly string[],
  screen: readonly string[],
) => Promise<Interpretation>;

export function createInterpreter({
  api,
  identity,
}: InterpreterOptions): Interpreter {
  return async (text, apps, screen) => {
    if (!identity.sessionToken()) return SIGNED_OUT;
    const startedAt = Date.now();
    const answer = await api.call({
      path: apiPaths.interpret,
      body: {
        text,
        apps: apps.slice(0, MAX_INTERPRET_APPS),
        supports: INTERPRET_ACTION_KINDS,
        ...(screen.length > 0 ? { screen } : {}),
      },
      schema: interpretResponseSchema,
      timeoutMs: INTERPRET_TIMEOUT_MS,
    });
    if (answer.code === "success") {
      return { kind: "actions", actions: answer.data.actions };
    }
    return { kind: "failed", reason: failedAfter(answer.error, startedAt) };
  };
}
