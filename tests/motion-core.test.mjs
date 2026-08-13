import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScriptModule } from "./helpers/load-typescript-module.mjs";

const core = loadTypeScriptModule("src/core/motion/index.ts");
const tolerance = 1e-10;

function approximatelyEqual(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message ?? "values differ"}: ${actual} !== ${expected}`);
}

test("every easing is deterministic, finite, clamped, and normalized at its boundaries", () => {
  for (const [name, easing] of Object.entries(core.allEasings)) {
    approximatelyEqual(easing.evaluate(0), 0, `${name} at zero`);
    approximatelyEqual(easing.evaluate(1), 1, `${name} at one`);
    const midpoint = easing.evaluate(0.5);
    assert.ok(Number.isFinite(midpoint), `${name} midpoint is finite`);
    approximatelyEqual(easing.evaluate(0.5), midpoint, `${name} repeated midpoint`);
    approximatelyEqual(easing.evaluate(-2), 0, `${name} clamps below range`);
    approximatelyEqual(easing.evaluate(3), 1, `${name} clamps above range`);
  }
});

test("representative standard easing values follow their mathematical definitions", () => {
  approximatelyEqual(core.linear.evaluate(0.5), 0.5, "linear midpoint");
  approximatelyEqual(core.quad.in.evaluate(0.5), 0.25, "quad in midpoint");
  approximatelyEqual(core.cubic.out.evaluate(0.5), 0.875, "cubic out midpoint");
  approximatelyEqual(core.sine.in.evaluate(0.5), 1 - Math.sqrt(0.5), "sine in midpoint");
  approximatelyEqual(core.expo.in.evaluate(0.5), 0.03125, "expo in midpoint");
  approximatelyEqual(core.circ.in.evaluate(0.5), 1 - Math.sqrt(0.75), "circ in midpoint");
});

test("Back easing intentionally overshoots while retaining exact endpoints", () => {
  assert.ok(core.back.in.evaluate(0.5) < 0, "back in undershoots");
  assert.ok(core.back.out.evaluate(0.5) > 1, "back out overshoots");
  assert.ok(core.back.inOut.evaluate(0.25) < 0, "back in-out undershoots");
  assert.ok(core.back.inOut.evaluate(0.75) > 1, "back in-out overshoots");
});

test("non-finite normalized times are rejected", () => {
  assert.throws(() => core.linear.evaluate(Number.NaN), RangeError);
  assert.throws(() => core.linear.evaluate(Number.POSITIVE_INFINITY), RangeError);
});

test("scalar interpolation supports endpoints, midpoint, and clamped progress", () => {
  approximatelyEqual(core.interpolateScalar(100, 200, 0), 100);
  approximatelyEqual(core.interpolateScalar(100, 200, 0.5), 150);
  approximatelyEqual(core.interpolateScalar(100, 200, 1), 200);
  approximatelyEqual(core.interpolateScalar(100, 200, -1), 100);
  approximatelyEqual(core.interpolateScalar(100, 200, 2), 200);
});

test("vector interpolation applies one normalized progress to every component", () => {
  assert.deepEqual(core.interpolateVector([0, 100], [500, 300], 0), [0, 100]);
  assert.deepEqual(core.interpolateVector([0, 100], [500, 300], 0.5), [250, 200]);
  assert.deepEqual(core.interpolateVector([0, 100], [500, 300], 1), [500, 300]);
});

test("interpolation rejects incompatible and invalid motion values", () => {
  assert.throws(() => core.interpolateVector([0], [0, 1], 0.5), RangeError);
  assert.throws(() => core.interpolateScalar(0, Number.NaN, 0.5), RangeError);
  assert.throws(() => core.interpolateValue(0, [1], 0.5), TypeError);
});

test("MotionCurve evaluates scalar and vector values without a host adapter", () => {
  const scalarCurve = new core.MotionCurve({ startValue: 100, endValue: 200, duration: 2, easing: core.linear });
  approximatelyEqual(scalarCurve.evaluate(-1), 100);
  approximatelyEqual(scalarCurve.evaluate(0), 100);
  approximatelyEqual(scalarCurve.evaluate(1), 150);
  approximatelyEqual(scalarCurve.evaluate(2), 200);
  approximatelyEqual(scalarCurve.evaluate(4), 200);

  const vectorCurve = new core.MotionCurve({ startValue: [0, 100], endValue: [500, 300], duration: 2, easing: core.linear });
  assert.deepEqual(vectorCurve.evaluate(1), [250, 200]);
});

test("MotionCurve handles zero duration and invalid duration/time inputs", () => {
  const instantCurve = new core.MotionCurve({ startValue: 100, endValue: 200, duration: 0, easing: core.linear });
  approximatelyEqual(instantCurve.evaluate(0), 200);
  assert.throws(() => new core.MotionCurve({ startValue: 0, endValue: 1, duration: -1, easing: core.linear }), RangeError);
  assert.throws(() => instantCurve.evaluate(Number.NaN), RangeError);
});

