import type { CurveControls } from "../../app/types";
import type { MockMotionController } from "../../app/mock-motion-controller";
import {
  CubicBezier,
  normalizedToGraphPoint,
  screenToNormalizedPoint,
  type BezierPoint,
  type CubicBezierControlPointId,
  type GraphRectangle
} from "../../core/motion";

const controls: Array<{ key: keyof CurveControls; label: string }> = [
  { key: "x1", label: "X1" },
  { key: "y1", label: "Y1" },
  { key: "x2", label: "X2" },
  { key: "y2", label: "Y2" }
];

const viewBox: GraphRectangle = { x: 0, y: 0, width: 320, height: 186 };
const graphRect: GraphRectangle = { x: 28, y: 14, width: 274, height: 140 };
const p0: BezierPoint = { x: 0, y: 0 };
const p3: BezierPoint = { x: 1, y: 1 };
const gridSteps = 4;

function curveControlPoint(curve: CurveControls, pointId: CubicBezierControlPointId): BezierPoint {
  return pointId === "p1" ? { x: curve.x1, y: curve.y1 } : { x: curve.x2, y: curve.y2 };
}

function svgPoint(point: BezierPoint): BezierPoint {
  return normalizedToGraphPoint(point, graphRect);
}

function formatControlValue(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function buildCurvePath(curve: CurveControls): string {
  const bezier = new CubicBezier(curve);
  const start = svgPoint(p0);
  const end = svgPoint(p3);
  const cp1 = svgPoint(curveControlPoint(bezier.controlPoints, "p1"));
  const cp2 = svgPoint(curveControlPoint(bezier.controlPoints, "p2"));
  return `M${start.x} ${start.y} C${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
}

function renderGridLines(): string {
  const lines: string[] = [];
  for (let index = 1; index < gridSteps; index += 1) {
    const x = graphRect.x + (graphRect.width * index) / gridSteps;
    const y = graphRect.y + (graphRect.height * index) / gridSteps;
    lines.push(`<line x1="${x}" y1="${graphRect.y}" x2="${x}" y2="${graphRect.y + graphRect.height}" class="graph-grid-line" />`);
    lines.push(`<line x1="${graphRect.x}" y1="${y}" x2="${graphRect.x + graphRect.width}" y2="${y}" class="graph-grid-line" />`);
  }
  return lines.join("");
}

export function renderCurveEditor(curve: CurveControls): string {
  const start = svgPoint(p0);
  const end = svgPoint(p3);
  const cp1 = svgPoint(curveControlPoint(curve, "p1"));
  const cp2 = svgPoint(curveControlPoint(curve, "p2"));
  return `
    <section class="curve-editor panel-section" data-curve-editor aria-labelledby="curve-title">
      <div class="section-heading">
        <span id="curve-title">CURVE</span>
        <button class="text-action" type="button" data-action="reset-curve">RESET</button>
      </div>
      <div class="curve-graph" aria-label="Cubic-Bezier curve graph">
        <svg data-curve-svg viewBox="0 0 320 186" role="img" aria-label="Interactive Cubic-Bezier curve editor">
          <rect x="28" y="14" width="274" height="140" class="graph-grid" />
          ${renderGridLines()}
          <line x1="28" y1="154" x2="302" y2="154" class="graph-axis" />
          <line x1="28" y1="14" x2="28" y2="154" class="graph-axis" />
          <path data-curve-path d="${buildCurvePath(curve)}" class="curve-path" />
          <line data-control-line="p1" x1="${start.x}" y1="${start.y}" x2="${cp1.x}" y2="${cp1.y}" class="control-line" />
          <line data-control-line="p2" x1="${end.x}" y1="${end.y}" x2="${cp2.x}" y2="${cp2.y}" class="control-line" />
          <circle cx="${start.x}" cy="${start.y}" r="4" class="endpoint-point" />
          <circle cx="${end.x}" cy="${end.y}" r="4" class="endpoint-point" />
          <circle data-control-point="p1" cx="${cp1.x}" cy="${cp1.y}" r="6" class="control-point" tabindex="0" />
          <circle data-control-point="p2" cx="${cp2.x}" cy="${cp2.y}" r="6" class="control-point" tabindex="0" />
          <text x="11" y="20" class="axis-label">Y</text>
          <text x="306" y="172" class="axis-label">X</text>
        </svg>
      </div>
      <div class="curve-controls">
        ${controls.map(({ key, label }) => `<label class="numeric-field">${label}<input data-curve-control="${key}" type="number" step="0.01" value="${formatControlValue(curve[key])}" /></label>`).join("")}
      </div>
    </section>`;
}

function updateCurveEditorDom(editor: HTMLElement, curve: CurveControls): void {
  const start = svgPoint(p0);
  const end = svgPoint(p3);
  const cp1 = svgPoint(curveControlPoint(curve, "p1"));
  const cp2 = svgPoint(curveControlPoint(curve, "p2"));

  editor.querySelector<SVGPathElement>("[data-curve-path]")?.setAttribute("d", buildCurvePath(curve));
  const p1Line = editor.querySelector<SVGLineElement>("[data-control-line='p1']");
  const p2Line = editor.querySelector<SVGLineElement>("[data-control-line='p2']");
  p1Line?.setAttribute("x1", String(start.x));
  p1Line?.setAttribute("y1", String(start.y));
  p1Line?.setAttribute("x2", String(cp1.x));
  p1Line?.setAttribute("y2", String(cp1.y));
  p2Line?.setAttribute("x1", String(end.x));
  p2Line?.setAttribute("y1", String(end.y));
  p2Line?.setAttribute("x2", String(cp2.x));
  p2Line?.setAttribute("y2", String(cp2.y));

  const p1Handle = editor.querySelector<SVGCircleElement>("[data-control-point='p1']");
  const p2Handle = editor.querySelector<SVGCircleElement>("[data-control-point='p2']");
  p1Handle?.setAttribute("cx", String(cp1.x));
  p1Handle?.setAttribute("cy", String(cp1.y));
  p2Handle?.setAttribute("cx", String(cp2.x));
  p2Handle?.setAttribute("cy", String(cp2.y));

  controls.forEach(({ key }) => {
    const input = editor.querySelector<HTMLInputElement>(`[data-curve-control='${key}']`);
    if (input) input.value = formatControlValue(curve[key]);
  });
}

export function bindCurveEditor(root: HTMLElement, controller: MockMotionController, onDragUpdate?: () => void): void {
  const editor = root.querySelector<HTMLElement>("[data-curve-editor]");
  const svg = editor?.querySelector<SVGSVGElement>("[data-curve-svg]");
  if (!editor || !svg) return;

  let activePoint: CubicBezierControlPointId | undefined;
  let animationFrame = 0;
  const requestFrame = typeof window.requestAnimationFrame === "function"
    ? window.requestAnimationFrame.bind(window)
    : (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 16);
  const cancelFrame = typeof window.cancelAnimationFrame === "function"
    ? window.cancelAnimationFrame.bind(window)
    : window.clearTimeout.bind(window);

  const scheduleUpdate = (curve: CurveControls) => {
    if (animationFrame) cancelFrame(animationFrame);
    animationFrame = requestFrame(() => {
      updateCurveEditorDom(editor, curve);
      animationFrame = 0;
    });
  };

  const updateFromPointer = (event: PointerEvent) => {
    if (!activePoint) return;
    const bounds = svg.getBoundingClientRect();
    const normalizedPoint = screenToNormalizedPoint(
      { x: event.clientX, y: event.clientY },
      { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height },
      viewBox,
      graphRect
    );
    const curve = controller.updateCurvePoint(activePoint, normalizedPoint, { notify: false });
    scheduleUpdate(curve);
    if (onDragUpdate) onDragUpdate();
  };

  svg.addEventListener("pointerdown", (event) => {
    const target = event.target as SVGElement;
    const pointId = target.getAttribute("data-control-point") as CubicBezierControlPointId | null;
    if (!pointId) return;
    activePoint = pointId;
    try {
      if (typeof target.setPointerCapture === "function") target.setPointerCapture(event.pointerId);
    } catch {
      // Some UXP SVG elements do not expose pointer capture; drag still works inside the graph.
    }
    editor.classList.add("is-dragging");
    event.preventDefault();
    updateFromPointer(event);
  });

  svg.addEventListener("pointermove", (event) => updateFromPointer(event));

  const finishDrag = (event: PointerEvent) => {
    if (!activePoint) return;
    const target = event.target as SVGElement;
    try {
      if (typeof target.releasePointerCapture === "function") target.releasePointerCapture(event.pointerId);
    } catch {
      // Matching the pointer-capture fallback above.
    }
    activePoint = undefined;
    editor.classList.remove("is-dragging");
    controller.commitCurveInteraction();
  };

  svg.addEventListener("pointerup", finishDrag);
  svg.addEventListener("pointercancel", finishDrag);
}
