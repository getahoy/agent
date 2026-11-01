import assert from "node:assert/strict";
import { test } from "node:test";
import { phoneEnding } from "../pairing/endedByPhone.ts";
import type { PairedPhone } from "../pairing/pairedPhone.ts";
import {
  type AgentFacts,
  afterPhoneEnded,
  agentState,
  agentStateSchema,
  menubarStatus,
} from "./appState.ts";

const pairedPhone: PairedPhone = {
  publicKey: "",
  displayName: "",
  platform: "ios",
  accountEmail: "o@e.com",
  pairedAt: 0,
};

const PHONE_KEY = "phone-key";

const connected: AgentFacts = {
  onboardingStep: "done",
  permissions: { accessibility: true, screenRecording: true },
  helper: "running",
  screenLocked: false,
  pairing: { kind: "idle" },
  pairedPhones: [
    {
      publicKey: PHONE_KEY,
      displayName: "iPhone",
      accountEmail: "owner@example.com",
      pairedAt: 0,
    },
  ],
  lanEnabled: true,
  connectedPhoneKeys: [PHONE_KEY],
  pausedPhoneKeys: [],
  lastConnectedAt: 0,
  endedNotice: null,
  pairingNewPhone: false,
  lastHeard: null,
};

test("a connected phone shows the solid mark", () => {
  assert.equal(menubarStatus(connected), "connected");
});

test("a paired phone that is not connected shows the outline", () => {
  assert.equal(
    menubarStatus({ ...connected, connectedPhoneKeys: [] }),
    "noPhone",
  );
});

test("no paired phone shows the outline", () => {
  const facts = { ...connected, pairedPhones: [], connectedPhoneKeys: [] };
  assert.equal(menubarStatus(facts), "noPhone");
});

test("a paused phone shows the outline", () => {
  const facts = {
    ...connected,
    connectedPhoneKeys: [],
    pausedPhoneKeys: [PHONE_KEY],
  };
  assert.equal(menubarStatus(facts), "noPhone");
});

test("turning Ahoy off shows the slash", () => {
  assert.equal(menubarStatus({ ...connected, lanEnabled: false }), "off");
});

test("a locked screen shows the slash", () => {
  assert.equal(menubarStatus({ ...connected, screenLocked: true }), "off");
});

test("missing accessibility shows the dot", () => {
  const permissions = { accessibility: false, screenRecording: true };
  assert.equal(menubarStatus({ ...connected, permissions }), "needsPermission");
});

test("missing screen recording shows no dot while screenshots are not built", () => {
  const permissions = { accessibility: true, screenRecording: false };
  assert.equal(menubarStatus({ ...connected, permissions }), "connected");
});

test("a stopped helper shows the dot", () => {
  assert.equal(
    menubarStatus({ ...connected, helper: "stopped" }),
    "needsPermission",
  );
});

test("a missing permission wins over off and locked", () => {
  const facts = {
    ...connected,
    lanEnabled: false,
    screenLocked: true,
    permissions: { accessibility: false, screenRecording: true },
  };
  assert.equal(menubarStatus(facts), "needsPermission");
});

test("off wins over a connected phone", () => {
  assert.equal(menubarStatus({ ...connected, lanEnabled: false }), "off");
});

const justPaired: AgentFacts = {
  ...connected,
  pairing: { kind: "paired", phoneName: "iPhone", accountEmail: "o@e.com" },
};

const phoneRecord = {
  ...pairedPhone,
  publicKey: PHONE_KEY,
  displayName: "iPhone",
};

test("a phone saying goodbye removed resets pairing and sets the notice", () => {
  const learned = { at: 5, whileAsleep: false };
  const ending = phoneEnding([phoneRecord], PHONE_KEY, "removed", learned);
  assert.equal(ending.kind, "ended");
  if (ending.kind !== "ended") return;
  const state = agentState(afterPhoneEnded(justPaired, [], ending.notice));
  assert.equal(state.pairing.kind, "idle");
  assert.deepEqual(state.endedNotice, {
    reason: "removed",
    deviceName: "iPhone",
    at: 5,
    whileAsleep: false,
  });
});

test("a code already on screen survives the phone ending", () => {
  const offering = {
    kind: "offering",
    qr: "qr",
    expiresAt: 1,
    reachableOnLan: true,
  } as const;
  const facts = afterPhoneEnded({ ...connected, pairing: offering }, [], null);
  assert.deepEqual(facts.pairing, offering);
});

test("paired with no phone left never shows the done screen", () => {
  const stale = agentState({ ...justPaired, pairedPhones: [] });
  assert.equal(stale.pairing.kind, "idle");
});

test("an ended notice in an old shape is dropped, not the whole state", () => {
  const old = { phoneName: "iPhone", reason: "removed" };
  const parsed = agentStateSchema.safeParse({
    ...agentState(connected),
    endedNotice: old,
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data?.endedNotice, null);
});
