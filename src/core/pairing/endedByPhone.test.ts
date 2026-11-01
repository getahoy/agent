import assert from "node:assert/strict";
import { test } from "node:test";
import {
  keepsCurrentCode,
  NOTICE_LIFETIME_MS,
  noticeAge,
  noticeShown,
  phoneEnding,
} from "./endedByPhone.ts";
import type { PairedPhone } from "./pairedPhone.ts";

const phone: PairedPhone = {
  publicKey: "p",
  displayName: "Priya’s iPhone",
  platform: "ios",
  accountEmail: "priya@example.com",
  pairedAt: 0,
};
const AT = 1_000_000;
const MINUTE = 60_000;
const learned = { at: AT, whileAsleep: false };

test("a phone ending the pairing leaves a notice naming it", () => {
  assert.deepEqual(phoneEnding([phone], "p", "removed", learned), {
    kind: "ended",
    notice: {
      reason: "removed",
      deviceName: "Priya’s iPhone",
      at: AT,
      whileAsleep: false,
    },
  });
});

test("an end for a phone this Mac already removed is ignored", () => {
  assert.deepEqual(phoneEnding([], "p", "signed_out", learned), {
    kind: "ignored",
  });
});

test("a phone replaced by this Mac shows no notice", () => {
  assert.deepEqual(phoneEnding([phone], "p", "replaced", learned), {
    kind: "ended",
    notice: null,
  });
});

test("pairing restarts from idle unless a code is on screen", () => {
  const offering = {
    kind: "offering",
    qr: "qr",
    expiresAt: 1,
    reachableOnLan: true,
  } as const;
  assert.equal(keepsCurrentCode(offering), true);
  assert.equal(keepsCurrentCode({ kind: "starting" }), true);
  const paired = { kind: "paired", phoneName: "x", accountEmail: "y" } as const;
  assert.equal(keepsCurrentCode(paired), false);
  assert.equal(keepsCurrentCode({ kind: "idle" }), false);
});

test("the notice expires after 24 hours", () => {
  const notice = { reason: "removed", deviceName: "x", ...learned } as const;
  assert.equal(noticeShown(notice, AT + NOTICE_LIFETIME_MS - 1), true);
  assert.equal(noticeShown(notice, AT + NOTICE_LIFETIME_MS), false);
});

test("the age reads just now, then minutes, then hours", () => {
  assert.deepEqual(noticeAge(AT, AT + MINUTE - 1), { kind: "justNow" });
  assert.deepEqual(noticeAge(AT, AT + 3 * MINUTE), {
    kind: "minutes",
    count: 3,
  });
  assert.deepEqual(noticeAge(AT, AT + 130 * MINUTE), {
    kind: "hours",
    count: 2,
  });
});
