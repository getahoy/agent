import { type RequestError, request } from "@getahoy/lib";
import {
  type InterpretAction,
  interpretResponseSchema,
  MAX_INTERPRET_APPS,
} from "@getahoy/protocol";
import type { IdentityStore } from "../identity/identityStore.ts";

const INTERPRET_TIMEOUT_MS = 7000;

type InterpreterOptions = { apiUrl: string; identity: IdentityStore };

export type InterpretFailure =
  | "signedOut"
  | "unreachable"
  | "unavailable"
  | "invalid";

export type Interpretation =
  | { kind: "actions"; actions: InterpretAction[] }
  | { kind: "failed"; reason: InterpretFailure };

export type Interpreter = (
  text: string,
  apps: readonly string[],
) => Promise<Interpretation>;

function failureOf(error: RequestError): InterpretFailure {
  switch (error.kind) {
    case "network":
      return "unreachable";
    case "malformed":
      return "invalid";
    case "api":
      return error.detail.code === "unauthorized" ? "signedOut" : "unavailable";
    default: {
      const unhandled: never = error;
      return unhandled;
    }
  }
}

export function createInterpreter(options: InterpreterOptions): Interpreter {
  const { apiUrl, identity } = options;
  return async (text, apps) => {
    const sessionToken = identity.sessionToken();
    if (!sessionToken) return { kind: "failed", reason: "signedOut" };
    const answer = await request({
      url: new URL("/api/interpret", apiUrl).toString(),
      method: "POST",
      body: { text, apps: apps.slice(0, MAX_INTERPRET_APPS) },
      headers: { authorization: `Bearer ${sessionToken}` },
      schema: interpretResponseSchema,
      timeoutMs: INTERPRET_TIMEOUT_MS,
    });
    if (answer.code === "success") {
      return { kind: "actions", actions: answer.data.actions };
    }
    return { kind: "failed", reason: failureOf(answer.error) };
  };
}
