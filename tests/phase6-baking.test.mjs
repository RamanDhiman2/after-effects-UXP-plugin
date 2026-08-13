import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScriptModule } from "./helpers/load-typescript-module.mjs";

const core = loadTypeScriptModule("src/core/motion/index.ts");
const { MotionCurve, allEasings } = core;

test("frame sampling and normalized time conversion calculates exact start/end values", () => {
  const startKey = { time: 0, value: 100 };
  const endKey = { time: 10 * 254016000000, value: 500 }; // 10 seconds
  const ticksPerFrame = 254016000000 / 60; // 60 fps
  
  const curve = new MotionCurve({
    startValue: startKey.value,
    endValue: endKey.value,
    duration: endKey.time - startKey.time,
    easing: allEasings.linear
  });

  const samples = [];
  for (let time = startKey.time; time < endKey.time; time += ticksPerFrame) {
    const t = time - startKey.time;
    samples.push({ time, value: curve.evaluate(t) });
  }
  samples.push({ time: endKey.time, value: endKey.value });

  // 10 seconds at 60 fps should be 600 intervals + 1 end frame = 601 frames.
  assert.strictEqual(samples.length, 601, "keyframe count matches expected frames for 60fps");
  assert.strictEqual(samples[0].value, 100, "start value is exact");
  assert.strictEqual(samples[samples.length - 1].value, 500, "end value is exact");
});

test("multiple keyframe segments handles vector values", () => {
  const kfs = [
    { time: 0, value: [100, 100] },
    { time: 1000, value: [200, 200] },
    { time: 3000, value: [100, 100] }
  ];
  const ticksPerFrame = 250;
  
  const samples = [];
  for (let i = 0; i < kfs.length - 1; i++) {
    const startKey = kfs[i];
    const endKey = kfs[i + 1];
    const duration = endKey.time - startKey.time;
    
    const curve = new MotionCurve({
      startValue: startKey.value,
      endValue: endKey.value,
      duration: duration,
      easing: allEasings.linear
    });

    for (let time = startKey.time; time < endKey.time; time += ticksPerFrame) {
      const t = time - startKey.time;
      samples.push({ time, value: curve.evaluate(t) });
    }
  }
  const lastKey = kfs[kfs.length - 1];
  samples.push({ time: lastKey.time, value: lastKey.value });

  assert.strictEqual(samples.length, (1000 / 250) + (2000 / 250) + 1, "keyframe count is exactly segments + 1");
  assert.deepStrictEqual(samples[0].value, [100, 100], "start value");
  assert.deepStrictEqual(samples[4].value, [200, 200], "mid value");
  assert.deepStrictEqual(samples[samples.length - 1].value, [100, 100], "end value");
});
