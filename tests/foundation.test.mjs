import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("UXP manifest targets Premiere with a panel entry point", async () => {
  const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
  assert.equal(manifest.manifestVersion, 5);
  assert.equal(manifest.host.app, "premierepro");
  assert.equal(manifest.entrypoints[0].type, "panel");
});

test("Phase 1 controller has no Premiere project integration", async () => {
  const source = await readFile("src/app/mock-motion-controller.ts", "utf8");
  assert.doesNotMatch(source, /from\s+["']premiere|require\(["']premiere|app\.project|activeSequence/i);
});
