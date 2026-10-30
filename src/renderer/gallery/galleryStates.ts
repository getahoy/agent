import type { AgentState } from "../../core/appState/appState.ts";

const PHONE_KEY = "gallery-phone";
const MINUTE_MS = 60_000;
const PAIRING_WINDOW_MS = 5 * MINUTE_MS;
const now = Date.now();

const connected: AgentState = {
  onboardingStep: "done",
  permissions: { accessibility: true, screenRecording: true },
  helper: "running",
  screenLocked: false,
  pairing: { kind: "idle" },
  pairedPhones: [
    {
      publicKey: PHONE_KEY,
      displayName: "Maya’s iPhone",
      accountEmail: "maya@example.com",
      pairedAt: now - 20 * 24 * 60 * MINUTE_MS,
    },
  ],
  lanEnabled: true,
  connectedPhoneKeys: [PHONE_KEY],
  pausedPhoneKeys: [],
  lastConnectedAt: now - 2 * MINUTE_MS,
  endedNotice: null,
  pairingNewPhone: false,
  lastHeard: { text: "close the grok tab", at: now - 2 * MINUTE_MS },
  screen: "home",
};

const offering: AgentState["pairing"] = {
  kind: "offering",
  qr: "ahoy://pair?gallery",
  expiresAt: now + PAIRING_WINDOW_MS,
  reachableOnLan: true,
};

export const phoneStates = {
  connected,
  notConnected: { ...connected, connectedPhoneKeys: [] },
  paused: {
    ...connected,
    connectedPhoneKeys: [],
    pausedPhoneKeys: [PHONE_KEY],
  },
  locked: { ...connected, screenLocked: true },
  off: { ...connected, lanEnabled: false, connectedPhoneKeys: [] },
  permissionMissing: {
    ...connected,
    permissions: { accessibility: false, screenRecording: true },
  },
  helperRestarting: { ...connected, helper: "stopped" },
  noPhone: {
    ...connected,
    pairedPhones: [],
    connectedPhoneKeys: [],
    lastHeard: null,
    pairing: offering,
  },
  endedByPhone: {
    ...connected,
    pairedPhones: [],
    connectedPhoneKeys: [],
    pairing: offering,
    endedNotice: { phoneName: "Maya’s iPhone", reason: "removed" },
  },
} satisfies Record<string, AgentState>;

export const pairingStates = {
  starting: { kind: "starting" },
  offering,
  offeringOffLan: { ...offering, reachableOnLan: false },
  network: { kind: "failed", reason: "network" },
  server: { kind: "failed", reason: "server" },
  updateRequired: { kind: "failed", reason: "updateRequired" },
  proofRejected: { kind: "failed", reason: "proofRejected" },
  paired: {
    kind: "paired",
    phoneName: "Maya’s iPhone",
    accountEmail: "maya@example.com",
  },
} satisfies Record<string, AgentState["pairing"]>;

export const setupStates = {
  permissionsNone: {
    ...connected,
    onboardingStep: "permissions",
    permissions: { accessibility: false, screenRecording: false },
  },
  permissionsHalf: {
    ...connected,
    onboardingStep: "permissions",
    permissions: { accessibility: true, screenRecording: false },
  },
} satisfies Record<string, AgentState>;
