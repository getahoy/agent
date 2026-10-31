import assert from "node:assert/strict";
import { test } from "node:test";
import { isOwnRendererUrl, type RendererOrigin } from "./ownRenderer.ts";

const INDEX = "file:///Applications/Ahoy.app/renderer/main_window/index.html";
const packaged: RendererOrigin = { devServerUrl: null, indexFileUrl: INDEX };
const dev: RendererOrigin = {
  devServerUrl: "http://localhost:5173",
  indexFileUrl: INDEX,
};

test("the packaged index file with any surface query is ours", () => {
  assert.equal(isOwnRendererUrl(`${INDEX}?surface=popover`, packaged), true);
});

test("another local file is not ours", () => {
  const other = "file:///Applications/Ahoy.app/renderer/other.html";
  assert.equal(isOwnRendererUrl(other, packaged), false);
});

test("a web page is not ours in a packaged build", () => {
  assert.equal(isOwnRendererUrl("https://example.com/", packaged), false);
});

test("the dev server with any path and query is ours in dev", () => {
  const url = "http://localhost:5173/?surface=gallery";
  assert.equal(isOwnRendererUrl(url, dev), true);
});

test("another port on localhost is not ours in dev", () => {
  assert.equal(isOwnRendererUrl("http://localhost:5174/", dev), false);
});

test("a file url is not ours in dev", () => {
  assert.equal(isOwnRendererUrl(INDEX, dev), false);
});

test("garbage is not ours", () => {
  assert.equal(isOwnRendererUrl("not a url", packaged), false);
  assert.equal(isOwnRendererUrl("", dev), false);
});
