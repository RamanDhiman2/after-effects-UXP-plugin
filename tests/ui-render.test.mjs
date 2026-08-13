import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScriptModule } from "./helpers/load-typescript-module.mjs";

const curveEditor = loadTypeScriptModule("src/ui/components/curve-editor.ts");

test("CurveEditor renders the complete default Bezier UI without unsupported SVG pattern dependencies", () => {
  const html = curveEditor.renderCurveEditor({ x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 });

  assert.match(html, /data-curve-editor/);
  assert.match(html, /data-curve-svg/);
  assert.match(html, /class="graph-grid"/);
  assert.match(html, /class="graph-grid-line"/);
  assert.match(html, /data-control-point="p1"/);
  assert.match(html, /data-control-point="p2"/);
  assert.match(html, /data-action="reset-curve"/);
  assert.match(html, /value="0\.25"/);
  assert.match(html, /value="0\.10"/);
  assert.match(html, /value="1\.00"/);
  assert.doesNotMatch(html, /<pattern|<defs|url\(#/);
});
