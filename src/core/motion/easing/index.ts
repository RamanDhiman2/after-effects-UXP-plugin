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
  backInOut: back.inOut
});
