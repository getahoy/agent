import type { PairingFailure, PairingStatus } from "./pairingStatus.ts";

type Offer = Extract<PairingStatus, { kind: "offering" }>;

export type CodeEvent =
  | { kind: "begin"; online: boolean }
  | { kind: "slow" }
  | { kind: "issued"; offer: Offer }
  | { kind: "missed"; failure: "network" | "server"; online: boolean }
  | { kind: "online" }
  | { kind: "due" }
  | { kind: "approved" }
  | { kind: "paired"; phoneName: string; accountEmail: string }
  | { kind: "refused"; reason: PairingFailure };

export type CodeEffect =
  | "request"
  | "awaitNetwork"
  | "poll"
  | "complete"
  | "none";

export type CodeState = { status: PairingStatus; retried: boolean };

export type CodeStep = { state: CodeState; effect: CodeEffect };

export const idleCode: CodeState = { status: { kind: "idle" }, retried: false };

function step(status: PairingStatus, effect: CodeEffect): CodeStep {
  return { state: { status, retried: false }, effect };
}

const making = step({ kind: "starting" }, "request");
const offline = step({ kind: "offline" }, "awaitNetwork");

function missed(
  state: CodeState,
  event: Extract<CodeEvent, { kind: "missed" }>,
): CodeStep {
  const { status } = state;
  if (!event.online) return offline;
  if (status.kind === "refreshing") {
    return step({ kind: "expired", qr: status.qr }, "none");
  }
  if (status.kind !== "starting" && status.kind !== "slow") {
    return { state, effect: "none" };
  }
  if (state.retried) {
    return step({ kind: "failed", reason: event.failure }, "none");
  }
  return { state: { status, retried: true }, effect: "request" };
}

export function codeStep(state: CodeState, event: CodeEvent): CodeStep {
  const { status } = state;
  const unchanged: CodeStep = { state, effect: "none" };
  switch (event.kind) {
    case "begin":
      return event.online ? making : offline;
    case "online":
      return status.kind === "offline" ? making : unchanged;
    case "slow":
      if (status.kind !== "starting") return unchanged;
      return { state: { ...state, status: { kind: "slow" } }, effect: "none" };
    case "issued":
      return step(event.offer, "poll");
    case "missed":
      return missed(state, event);
    case "due":
      if (status.kind !== "offering") return unchanged;
      return step({ kind: "refreshing", qr: status.qr }, "request");
    case "approved":
      if (status.kind !== "offering") return unchanged;
      return step({ kind: "scanned", qr: status.qr }, "complete");
    case "paired": {
      const { phoneName, accountEmail } = event;
      return step({ kind: "paired", phoneName, accountEmail }, "none");
    }
    case "refused":
      return step({ kind: "failed", reason: event.reason }, "none");
    default: {
      const unhandled: never = event;
      return unhandled;
    }
  }
}
