import type { AgentState } from "../../core/appState/appState.ts";

const PHONE_KEY = "gallery-phone";
const SECOND_MS = 1000;
const MINUTE_MS = 60_000;
const DAY_MS = 1440 * MINUTE_MS;
const PAIRING_WINDOW_MS = 5 * MINUTE_MS;
const PAIRED_AGO_MS = 20 * DAY_MS;
const HEARD_AGO_MS = 2 * MINUTE_MS;
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
      pairedAt: now - PAIRED_AGO_MS,
    },
  ],
  lanEnabled: true,
  connectedPhoneKeys: [PHONE_KEY],
  pausedPhoneKeys: [],
  lastConnectedAt: now - HEARD_AGO_MS,
  endedNotice: null,
  pairingNewPhone: false,
  lastHeard: { text: "close the grok tab", at: now - HEARD_AGO_MS },
  screen: "home",
};

const GALLERY_QR = "ahoy://pair?gallery";

const offering: AgentState["pairing"] = {
  kind: "offering",
  qr: GALLERY_QR,
  expiresAt: Math.floor((now + PAIRING_WINDOW_MS) / SECOND_MS),
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
    endedNotice: {
      reason: "removed",
      deviceName: "Maya’s iPhone",
      at: Date.now(),
      whileAsleep: false,
    },
  },
} satisfies Record<string, AgentState>;

export const pairingStates = {
  starting: { kind: "starting" },
  slow: { kind: "slow" },
  offering,
  offeringOffLan: { ...offering, reachableOnLan: false },
  refreshing: { kind: "refreshing", qr: GALLERY_QR },
  offline: { kind: "offline" },
  expired: { kind: "expired", qr: GALLERY_QR },
  scanned: { kind: "scanned", qr: GALLERY_QR },
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
