import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_BLOCKED_APPS, isBlockedApp } from "./blockedApps.ts";
import {
  closedBreaker,
  MAX_ACTIONS_PER_MINUTE,
  MAX_FAILURES_IN_ROW,
  recordCommand,
} from "./breaker.ts";

test("password managers and keychain are blocked by default", () => {
  assert.equal(
    isBlockedApp("com.1password.1password", DEFAULT_BLOCKED_APPS),
    true,
  );
  assert.equal(
    isBlockedApp("com.apple.KeychainAccess", DEFAULT_BLOCKED_APPS),
    true,
  );
  assert.equal(isBlockedApp("com.apple.Safari", DEFAULT_BLOCKED_APPS), false);
});

test("more than 30 commands in a minute trips the breaker", () => {
  let breaker = closedBreaker;
  for (let count = 0; count < MAX_ACTIONS_PER_MINUTE; count++) {
    breaker = recordCommand(breaker, "done", count);
  }
  assert.equal(breaker.tripped, false);
  assert.equal(recordCommand(breaker, "done", 100).tripped, true);
});

test("commands older than a minute no longer count", () => {
  let breaker = closedBreaker;
  for (let count = 0; count < MAX_ACTIONS_PER_MINUTE; count++) {
    breaker = recordCommand(breaker, "done", count);
  }
  assert.equal(recordCommand(breaker, "done", 61_000).tripped, false);
});

test("five failures in a row trip it, a success in between resets", () => {
  let breaker = closedBreaker;
  for (let count = 1; count < MAX_FAILURES_IN_ROW; count++) {
    breaker = recordCommand(breaker, "failed", count);
  }
  assert.equal(recordCommand(breaker, "done", 10).tripped, false);
  assert.equal(recordCommand(breaker, "failed", 10).tripped, true);
});

test("a tripped breaker stays tripped until it is reset", () => {
  const tripped = { ...closedBreaker, tripped: true };
  assert.equal(recordCommand(tripped, "done", 999_999).tripped, true);
});
