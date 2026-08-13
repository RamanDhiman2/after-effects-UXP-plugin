import { assertFiniteNumber } from "../normalization";
import type { BezierPoint } from "./cubic-bezier";

export interface GraphRectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function assertRectangle(rectangle: GraphRectangle, label: string): void {
  assertFiniteNumber(rectangle.x, `${label} x`);
  assertFiniteNumber(rectangle.y, `${label} y`);
  assertFiniteNumber(rectangle.width, `${label} width`);
  assertFiniteNumber(rectangle.height, `${label} height`);
  if (rectangle.width <= 0 || rectangle.height <= 0) {
    throw new RangeError(`${label} width and height must be positive.`);
  }
}

function assertPoint(point: BezierPoint, label: string): void {
  assertFiniteNumber(point.x, `${label} x`);
  assertFiniteNumber(point.y, `${label} y`);
}

export function normalizedToGraphPoint(point: BezierPoint, graphRect: GraphRectangle): BezierPoint {
  assertPoint(point, "Normalized point");
  assertRectangle(graphRect, "Graph rectangle");
  return {
    x: graphRect.x + point.x * graphRect.width,
    y: graphRect.y + (1 - point.y) * graphRect.height
  };
}

export function graphToNormalizedPoint(point: BezierPoint, graphRect: GraphRectangle): BezierPoint {
  assertPoint(point, "Graph point");
  assertRectangle(graphRect, "Graph rectangle");
  return {
    x: (point.x - graphRect.x) / graphRect.width,
    y: 1 - (point.y - graphRect.y) / graphRect.height
  };
}

export function screenToNormalizedPoint(
  screenPoint: BezierPoint,
  screenRect: GraphRectangle,
  viewBox: GraphRectangle,
  graphRect: GraphRectangle
): BezierPoint {
  assertPoint(screenPoint, "Screen point");
  assertRectangle(screenRect, "Screen rectangle");
  assertRectangle(viewBox, "SVG viewBox");
  assertRectangle(graphRect, "Graph rectangle");

  const viewBoxPoint = {
    x: viewBox.x + ((screenPoint.x - screenRect.x) / screenRect.width) * viewBox.width,
    y: viewBox.y + ((screenPoint.y - screenRect.y) / screenRect.height) * viewBox.height
  };

  return graphToNormalizedPoint(viewBoxPoint, graphRect);
}

