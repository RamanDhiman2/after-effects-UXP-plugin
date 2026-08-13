import type { EasingFunction } from "../models";
import { normalizeTime } from "../normalization";

export interface EasingFamily {
  readonly in: EasingFunction;
  readonly out: EasingFunction;
  readonly inOut: EasingFunction;
}

function createEasing(name: string, evaluator: (time: number) => number): EasingFunction {
  return Object.freeze({
    name,
    evaluate(time: number): number {
      return evaluator(normalizeTime(time));
    }
  });
}

function createPowerFamily(name: string, power: number): EasingFamily {
  // Power curves accelerate/decelerate by raising normalized time to the given exponent.
  return {
    in: createEasing(`${name}.in`, (time) => time ** power),
    out: createEasing(`${name}.out`, (time) => 1 - (1 - time) ** power),
    inOut: createEasing(`${name}.inOut`, (time) => (
      time < 0.5
        ? (2 ** (power - 1)) * time ** power
        : 1 - ((-2 * time + 2) ** power) / 2
    ))
  };
}

export const linear = createEasing("linear", (time) => time);

export const quad = createPowerFamily("quad", 2);
export const cubic = createPowerFamily("cubic", 3);
export const quart = createPowerFamily("quart", 4);
export const quint = createPowerFamily("quint", 5);

/** The generic ease aliases use the standard quadratic family. */
export const easeIn = quad.in;
export const easeOut = quad.out;
export const easeInOut = quad.inOut;

/** Sine curves use trigonometric acceleration for a softer start or finish. */
export const sine: EasingFamily = {
  in: createEasing("sine.in", (time) => 1 - Math.cos((time * Math.PI) / 2)),
  out: createEasing("sine.out", (time) => Math.sin((time * Math.PI) / 2)),
  inOut: createEasing("sine.inOut", (time) => -(Math.cos(Math.PI * time) - 1) / 2)
};

/** Expo curves ramp aggressively while preserving exact 0 and 1 endpoints. */
export const expo: EasingFamily = {
  in: createEasing("expo.in", (time) => (time === 0 ? 0 : 2 ** (10 * time - 10))),
  out: createEasing("expo.out", (time) => (time === 1 ? 1 : 1 - 2 ** (-10 * time))),
  inOut: createEasing("expo.inOut", (time) => {
    if (time === 0 || time === 1) return time;
    return time < 0.5
      ? 2 ** (20 * time - 10) / 2
      : (2 - 2 ** (-20 * time + 10)) / 2;
  })
};

/** Circ curves follow a circular arc shape for stronger easing near the ends. */
export const circ: EasingFamily = {
  in: createEasing("circ.in", (time) => 1 - Math.sqrt(1 - time ** 2)),
  out: createEasing("circ.out", (time) => Math.sqrt(1 - (time - 1) ** 2)),
  inOut: createEasing("circ.inOut", (time) => (
    time < 0.5
      ? (1 - Math.sqrt(1 - (2 * time) ** 2)) / 2
      : (Math.sqrt(1 - (-2 * time + 2) ** 2) + 1) / 2
  ))
};

// Back curves intentionally overshoot their normal output range near the ends.
const backCoefficient = 1.70158;
const backInOutCoefficient = backCoefficient * 1.525;
export const back: EasingFamily = {
  in: createEasing("back.in", (time) => (
    (backCoefficient + 1) * time ** 3 - backCoefficient * time ** 2
  )),
  out: createEasing("back.out", (time) => (
    1 + (backCoefficient + 1) * (time - 1) ** 3 + backCoefficient * (time - 1) ** 2
  )),
  inOut: createEasing("back.inOut", (time) => (
    time < 0.5
      ? ((2 * time) ** 2 * ((backInOutCoefficient + 1) * 2 * time - backInOutCoefficient)) / 2
      : ((2 * time - 2) ** 2 * ((backInOutCoefficient + 1) * (time * 2 - 2) + backInOutCoefficient) + 2) / 2
  ))
};

/** Bounce curves simulate physical bouncing collisions. */
function createBounceFamily(bounces = 3, elasticity = 0.65): EasingFamily {
  let sum = 1;
  for (let i = 1; i <= bounces; i += 1) {
    sum += 2 * Math.pow(elasticity, i / 2);
  }
  const t0 = 1 / sum;

  const phases = [{ start: 0, end: t0, peak: 0, height: 1 }];
  let start = t0;
  for (let i = 1; i <= bounces; i += 1) {
    const t = t0 * Math.pow(elasticity, i / 2);
    const h = Math.pow(elasticity, i);
    phases.push({ start, end: start + 2 * t, peak: start + t, height: h });
    start += 2 * t;
  }

  const evaluateOut = (time: number) => {
    if (time === 0 || time === 1) return time;
    for (let i = 0; i < phases.length; i += 1) {
      const p = phases[i];
      if (time <= p.end) {
        if (i === 0) return (time / p.end) ** 2;
        const normalized = (time - p.peak) / (p.peak - p.start);
        return 1 - p.height * (1 - normalized ** 2);
      }
    }
    return 1;
  };

  return {
    in: createEasing("bounce.in", (time) => 1 - evaluateOut(1 - time)),
    out: createEasing("bounce.out", evaluateOut),
    inOut: createEasing("bounce.inOut", (time) =>
      time < 0.5
        ? (1 - evaluateOut(1 - 2 * time)) / 2
        : (1 + evaluateOut(2 * time - 1)) / 2
    )
  };
}
export const bounce = createBounceFamily();

/** Elastic curves simulate a stretched band oscillating back to its rest position. */
function createElasticFamily(amplitude = 1, period = 0.3): EasingFamily {
  const a = Math.max(1, amplitude);
  const s = (period / (2 * Math.PI)) * Math.asin(1 / a);

  const evaluateOut = (time: number) => {
    if (time === 0 || time === 1) return time;
    return a * Math.pow(2, -10 * time) * Math.sin(((time - s) * (2 * Math.PI)) / period) + 1;
  };
  const evaluateIn = (time: number) => {
    if (time === 0 || time === 1) return time;
    const t = time - 1;
    return -(a * Math.pow(2, 10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / period));
  };
  const evaluateInOut = (time: number) => {
    if (time === 0 || time === 1) return time;
    const t = time * 2 - 1;
    if (t < 0) {
      return -0.5 * (a * Math.pow(2, 10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / period));
    }
    return a * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / period) * 0.5 + 1;
  };

  return {
    in: createEasing("elastic.in", evaluateIn),
    out: createEasing("elastic.out", evaluateOut),
    inOut: createEasing("elastic.inOut", evaluateInOut)
  };
}
export const elastic = createElasticFamily();

/** Spring curves simulate physics-based dampened harmonic oscillators. */
function createSpringFamily(mass = 1, stiffness = 100, damping = 10): EasingFamily {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  const evaluateOut = (time: number) => {
    if (time === 0 || time === 1) return time;
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      const b = (zeta * w0) / wd;
      return 1 - Math.exp(-zeta * w0 * time) * (Math.cos(wd * time) + b * Math.sin(wd * time));
    }
    return 1 - Math.exp(-w0 * time) * (1 + w0 * time);
  };

  return {
    in: createEasing("spring.in", (time) => 1 - evaluateOut(1 - time)),
    out: createEasing("spring.out", evaluateOut),
    inOut: createEasing("spring.inOut", (time) =>
      time < 0.5
        ? (1 - evaluateOut(1 - 2 * time)) / 2
        : (1 + evaluateOut(2 * time - 1)) / 2
    )
  };
}
export const spring = createSpringFamily();

/** Every available easing is exported once for consumers, tests, and future UI mapping. */
export const allEasings = Object.freeze({
  linear,
  easeIn,
  easeOut,
  easeInOut,
  quadIn: quad.in,
  quadOut: quad.out,
  quadInOut: quad.inOut,
  cubicIn: cubic.in,
  cubicOut: cubic.out,
  cubicInOut: cubic.inOut,
  quartIn: quart.in,
  quartOut: quart.out,
  quartInOut: quart.inOut,
  quintIn: quint.in,
  quintOut: quint.out,
  quintInOut: quint.inOut,
  sineIn: sine.in,
  sineOut: sine.out,
  sineInOut: sine.inOut,
  expoIn: expo.in,
  expoOut: expo.out,
  expoInOut: expo.inOut,
  circIn: circ.in,
  circOut: circ.out,
  circInOut: circ.inOut,
  backIn: back.in,
  backOut: back.out,
  backInOut: back.inOut,
  bounceIn: bounce.in,
  bounceOut: bounce.out,
  bounceInOut: bounce.inOut,
  elasticIn: elastic.in,
  elasticOut: elastic.out,
  elasticInOut: elastic.inOut,
  springIn: spring.in,
  springOut: spring.out,
  springInOut: spring.inOut
});
