import { type ApiClient, type FailureKind, failureKind } from "@getahoy/lib";
import {
  apiPaths,
  type InterpretAction,
  interpretResponseSchema,
  MAX_INTERPRET_APPS,
} from "@getahoy/protocol";
import type { IdentityStore } from "../identity/identityStore.ts";

const INTERPRET_TIMEOUT_MS = 7000;
const SIGNED_OUT = { kind: "failed", reason: "signedOut" } as const;

type InterpreterOptions = { api: ApiClient; identity: IdentityStore };

export type Interpretation =
  | { kind: "actions"; actions: InterpretAction[] }
  | { kind: "failed"; reason: FailureKind };

export type Interpreter = (
  text: string,
  apps: readonly string[],
) => Promise<Interpretation>;

export function createInterpreter({
  api,
  identity,
}: InterpreterOptions): Interpreter {
  return async (text, apps) => {
    if (!identity.sessionToken()) return SIGNED_OUT;
    const answer = await api.call({
      path: apiPaths.interpret,
      body: { text, apps: apps.slice(0, MAX_INTERPRET_APPS) },
      schema: interpretResponseSchema,
      timeoutMs: INTERPRET_TIMEOUT_MS,
    });
    if (answer.code === "success") {
      return { kind: "actions", actions: answer.data.actions };
    }
    return { kind: "failed", reason: failureKind(answer.error) };
  };
}
