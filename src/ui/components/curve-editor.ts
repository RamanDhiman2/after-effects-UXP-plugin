import type { CurveControls } from "../../app/types";

const controls: Array<{ key: keyof CurveControls; label: string }> = [
  { key: "x1", label: "X1" },
  { key: "y1", label: "Y1" },
  { key: "x2", label: "X2" },
  { key: "y2", label: "Y2" }
];

export function renderCurveEditor(curve: CurveControls): string {
  return `
    <section class="curve-editor panel-section" aria-labelledby="curve-title">
      <div class="section-heading"><span id="curve-title">CURVE</span><span class="section-note">MOCK PREVIEW</span></div>
      <div class="curve-graph" aria-label="Mock curve graph">
        <svg viewBox="0 0 320 186" role="img" aria-label="Bezier-style mock curve with two control points">
          <defs>
            <pattern id="curve-grid" width="32" height="31" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 31" fill="none" stroke="currentColor" stroke-width="0.5" />
            </pattern>
          </defs>
          <rect x="28" y="14" width="274" height="140" class="graph-grid" fill="url(#curve-grid)" />
          <line x1="28" y1="154" x2="302" y2="154" class="graph-axis" />
          <line x1="28" y1="14" x2="28" y2="154" class="graph-axis" />
          <path d="M28 154 C96 146, 98 36, 302 14" class="curve-path" />
          <line x1="28" y1="154" x2="96" y2="146" class="control-line" />
          <line x1="302" y1="14" x2="98" y2="36" class="control-line" />
          <circle cx="96" cy="146" r="5" class="control-point" />
          <circle cx="98" cy="36" r="5" class="control-point" />
          <text x="11" y="20" class="axis-label">Y</text>
          <text x="306" y="172" class="axis-label">X</text>
        </svg>
      </div>
      <div class="curve-controls">
        ${controls.map(({ key, label }) => `<label class="numeric-field">${label}<input data-curve-control="${key}" inputmode="decimal" type="number" step="0.01" value="${curve[key]}" /></label>`).join("")}
      </div>
    </section>`;
}

