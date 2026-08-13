import { interpolateValue } from "./interpolation";
import type { MotionCurveDefinition, MotionValue } from "./models";
import { assertFiniteNumber, normalizeTime } from "./normalization";

/**
 * Mathematical curve independent of any host. A zero-duration curve represents
 * an instantaneous transition and therefore always evaluates to its end value.
 */
export class MotionCurve<T extends MotionValue> {
  public readonly startValue: T;
  public readonly endValue: T;
  public readonly duration: MotionCurveDefinition<T>["duration"];
  public readonly easing: MotionCurveDefinition<T>["easing"];

  public constructor({ startValue, endValue, duration, easing }: MotionCurveDefinition<T>) {
    assertFiniteNumber(duration, "Curve duration");
    if (duration < 0) {
      throw new RangeError("Curve duration cannot be negative.");
    }

    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.easing = easing;
  }

  public evaluate(time: number): T {
    assertFiniteNumber(time, "Curve evaluation time");
    if (this.duration === 0) {
      return interpolateValue(this.endValue, this.endValue, 1);
    }

    const normalizedTime = normalizeTime(time / this.duration);
    return interpolateValue(this.startValue, this.endValue, this.easing.evaluate(normalizedTime));
  }
}
