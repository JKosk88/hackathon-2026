import test from "node:test";
import assert from "node:assert/strict";
import manifestFactory from "../app/manifest.ts";

test("manifest exposes installable PWA metadata", async () => {
  const manifest = await manifestFactory();

  assert.equal(manifest.name, "CityVibe");
  assert.equal(manifest.short_name, "CityVibe");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.display, "standalone");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
});
