import assert from "node:assert/strict";
import { test } from "node:test";
import { type AgentFacts, menubarStatus } from "./appState.ts";

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
