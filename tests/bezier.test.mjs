import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScriptModule } from "./helpers/load-typescript-module.mjs";

const core = loadTypeScriptModule("src/core/motion/index.ts");
const tolerance = 1e-7;

function approximatelyEqual(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message ?? "values differ"}: ${actual} !== ${expected}`);
}

test("CubicBezier exposes fixed P0 and P3 through point evaluation", () => {
  const bezier = new core.CubicBezier(core.CUBIC_BEZIER_DEFAULT_CONTROLS);
  assert.deepEqual(bezier.pointAt(0), { x: 0, y: 0 });
  assert.deepEqual(bezier.pointAt(1), { x: 1, y: 1 });
});

test("CubicBezier follows the standard cubic formula at the parameter midpoint", () => {
  const bezier = new core.CubicBezier({ x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 });
  const point = bezier.pointAt(0.5);
  approximatelyEqual(point.x, 0.3125, "midpoint x");
  approximatelyEqual(point.y, 0.5375, "midpoint y");
});

test("default CubicBezier evaluates deterministically as an easing function", () => {
  const bezier = new core.CubicBezier();
  approximatelyEqual(bezier.evaluate(0), 0, "easing start");
  approximatelyEqual(bezier.evaluate(1), 1, "easing end");
  const midpoint = bezier.evaluate(0.5);
  assert.ok(Number.isFinite(midpoint), "midpoint is finite");
  approximatelyEqual(bezier.evaluate(0.5), midpoint, "repeat midpoint");
});

test("CubicBezier control point updates return a new validated curve", () => {
  const bezier = new core.CubicBezier();
  const updated = bezier.updateControlPoint("p1", { x: 0.5, y: 1.25 });
  assert.notEqual(updated, bezier);
  assert.deepEqual(updated.controlPoints, { x1: 0.5, y1: 1.25, x2: 0.25, y2: 1 });
});

test("CubicBezier validation rejects non-finite values and clamps editor policy ranges", () => {
  assert.throws(() => new core.CubicBezier({ x1: Number.NaN, y1: 0, x2: 1, y2: 1 }), RangeError);
  const clamped = new core.CubicBezier({ x1: -1, y1: -3, x2: 2, y2: 3 });
  assert.deepEqual(clamped.controlPoints, { x1: 0, y1: -2, x2: 1, y2: 2 });
});

test("graph coordinate conversion preserves normalized points and supports boundary values", () => {
  const graphRect = { x: 28, y: 14, width: 274, height: 140 };
  const graphPoint = core.normalizedToGraphPoint({ x: 0.5, y: 0.25 }, graphRect);
  approximatelyEqual(graphPoint.x, 165, "graph x");
  approximatelyEqual(graphPoint.y, 119, "graph y");

  const normalized = core.graphToNormalizedPoint(graphPoint, graphRect);
  approximatelyEqual(normalized.x, 0.5, "normalized x");
  approximatelyEqual(normalized.y, 0.25, "normalized y");
});

test("screen coordinate conversion accounts for responsive SVG scaling", () => {
  const screenRect = { x: 10, y: 20, width: 640, height: 372 };
  const viewBox = { x: 0, y: 0, width: 320, height: 186 };
  const graphRect = { x: 28, y: 14, width: 274, height: 140 };
  const screenPoint = { x: 10 + 330, y: 20 + 238 };
  const normalized = core.screenToNormalizedPoint(screenPoint, screenRect, viewBox, graphRect);
  approximatelyEqual(normalized.x, 0.5, "screen normalized x");
  approximatelyEqual(normalized.y, 0.25, "screen normalized y");
});

