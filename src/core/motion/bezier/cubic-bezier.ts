import type { EasingFunction, NormalizedTime } from "../models";
import { assertFiniteNumber, normalizeTime } from "../normalization";

export interface BezierPoint {
  readonly x: number;
  readonly y: number;
}

export interface CubicBezierControls {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export type CubicBezierControlPointId = "p1" | "p2";

export const CUBIC_BEZIER_DEFAULT_CONTROLS: CubicBezierControls = Object.freeze({
  x1: 0.25,
  y1: 0.1,
  x2: 0.25,
  y2: 1
});

export const CUBIC_BEZIER_RANGE_POLICY = Object.freeze({
  minX: 0,
  maxX: 1,
  minY: -2,
  maxY: 2
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createCubicBezierPoint(point: BezierPoint): BezierPoint {
  assertFiniteNumber(point.x, "Bezier control point x");
  assertFiniteNumber(point.y, "Bezier control point y");
  return {
    x: clamp(point.x, CUBIC_BEZIER_RANGE_POLICY.minX, CUBIC_BEZIER_RANGE_POLICY.maxX),
    y: clamp(point.y, CUBIC_BEZIER_RANGE_POLICY.minY, CUBIC_BEZIER_RANGE_POLICY.maxY)
  };
}

export function createCubicBezierControls(controls: CubicBezierControls): CubicBezierControls {
  const p1 = createCubicBezierPoint({ x: controls.x1, y: controls.y1 });
  const p2 = createCubicBezierPoint({ x: controls.x2, y: controls.y2 });
  return Object.freeze({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
}

export function updateCubicBezierControlPoint(
  controls: CubicBezierControls,
  pointId: CubicBezierControlPointId,
  point: BezierPoint
): CubicBezierControls {
  const nextPoint = createCubicBezierPoint(point);
  return createCubicBezierControls(pointId === "p1"
    ? { ...controls, x1: nextPoint.x, y1: nextPoint.y }
    : { ...controls, x2: nextPoint.x, y2: nextPoint.y });
}

function pointAtParameter(time: number, controls: CubicBezierControls): BezierPoint {
  const t = normalizeTime(time);
  const oneMinusT = 1 - t;
  const p0Weight = oneMinusT ** 3;
  const p1Weight = 3 * oneMinusT ** 2 * t;
  const p2Weight = 3 * oneMinusT * t ** 2;
  const p3Weight = t ** 3;

  return {
    x: p0Weight * 0 + p1Weight * controls.x1 + p2Weight * controls.x2 + p3Weight * 1,
    y: p0Weight * 0 + p1Weight * controls.y1 + p2Weight * controls.y2 + p3Weight * 1
  };
}

function solveParameterForX(x: number, controls: CubicBezierControls): number {
  const targetX = normalizeTime(x);
  let low = 0;
  let high = 1;
  let time = targetX;

  for (let index = 0; index < 32; index += 1) {
    time = (low + high) / 2;
    const sampleX = pointAtParameter(time, controls).x;
    if (Math.abs(sampleX - targetX) < 1e-7) return time;
    if (sampleX < targetX) {
      low = time;
    } else {
      high = time;
    }
  }

  return time;
}

/**
 * Host-independent cubic-bezier easing. P0 and P3 are fixed at (0,0) and (1,1).
 * X controls are clamped to [0,1] for a stable time mapping; Y controls allow
 * limited overshoot in [-2,2] for future Back/Elastic-style editor states.
 */
export class CubicBezier implements EasingFunction {
  public readonly name = "cubicBezier";
  public readonly controlPoints: CubicBezierControls;

  public constructor(controls: CubicBezierControls = CUBIC_BEZIER_DEFAULT_CONTROLS) {
    this.controlPoints = createCubicBezierControls(controls);
  }

  public pointAt(parameter: number): BezierPoint {
    return pointAtParameter(parameter, this.controlPoints);
  }

  public evaluate(time: NormalizedTime): number {
    if (time === 0 || time === 1) return time;
    const parameter = solveParameterForX(time, this.controlPoints);
    return this.pointAt(parameter).y;
  }

  public updateControlPoint(pointId: CubicBezierControlPointId, point: BezierPoint): CubicBezier {
    return new CubicBezier(updateCubicBezierControlPoint(this.controlPoints, pointId, point));
  }
}

