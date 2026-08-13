/**
 * Project policy: normalized time is clamped to [0, 1]. Non-finite values are
 * invalid and are rejected rather than silently coerced into an animation value.
 */
import type { NormalizedTime } from "./models";

export function normalizeTime(time: number): NormalizedTime {
  if (!Number.isFinite(time)) {
    throw new RangeError("Normalized time must be a finite number.");
  }

  return Math.min(1, Math.max(0, time));
}

export function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }
}
