import type { EasingPreset } from "../../app/types";

const presets: EasingPreset[] = ["smooth", "bounce", "elastic", "spring", "custom"];

export function renderEasingPresets(selected: EasingPreset): string {
  return `
    <section class="panel-section" aria-labelledby="preset-title">
      <div class="section-heading"><span id="preset-title">EASING PRESET</span><span class="section-note">UI ONLY</span></div>
      <div class="preset-grid">
        ${presets.map((preset) => `<button type="button" class="preset-button${preset === selected ? " is-selected" : ""}" data-easing="${preset}" aria-pressed="${preset === selected}">${preset}</button>`).join("")}
      </div>
    </section>`;
}

