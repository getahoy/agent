import assert from "node:assert/strict";
import { test } from "node:test";
import { waitsForFirstLoad } from "./historyFirstLoad.ts";

const empty = { pending: true, cachedPages: 0, localEntries: 0 };

test("a first load with nothing cached and nothing local waits", () => {
  assert.equal(waitsForFirstLoad(empty), true);
});

test("a cached page or a just-finished command shows at once", () => {
  assert.equal(waitsForFirstLoad({ ...empty, cachedPages: 1 }), false);
  assert.equal(waitsForFirstLoad({ ...empty, localEntries: 1 }), false);
});

test("a settled load never waits", () => {
  assert.equal(waitsForFirstLoad({ ...empty, pending: false }), false);
});
