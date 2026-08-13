import type { MotionValue, Scalar, VectorValue } from "./models";
import { assertFiniteNumber, normalizeTime } from "./normalization";

function assertValidVector(value: VectorValue, label: string): void {
  value.forEach((component, index) => assertFiniteNumber(component, `${label}[${index}]`));
}

export function interpolateScalar(start: Scalar, end: Scalar, progress: number): Scalar {
  assertFiniteNumber(start, "Scalar start value");
  assertFiniteNumber(end, "Scalar end value");
  const normalizedProgress = normalizeTime(progress);
  return start + normalizedProgress * (end - start);
}

export function interpolateVector(start: VectorValue, end: VectorValue, progress: number): number[] {
  assertValidVector(start, "Vector start value");
  assertValidVector(end, "Vector end value");
  if (start.length !== end.length) {
    throw new RangeError("Vector values must have matching dimensions.");
  }

  const normalizedProgress = normalizeTime(progress);
  return start.map((component, index) => component + normalizedProgress * (end[index] - component));
}

export function interpolateValue<T extends MotionValue>(start: T, end: T, progress: number): T {
  if (typeof start === "number" && typeof end === "number") {
    return interpolateScalar(start, end, progress) as T;
  }

  if (Array.isArray(start) && Array.isArray(end)) {
    return interpolateVector(start, end, progress) as unknown as T;
  }

  throw new TypeError("Motion values must both be scalars or both be vectors.");
}
