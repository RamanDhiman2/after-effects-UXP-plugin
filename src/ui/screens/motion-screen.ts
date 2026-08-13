import type { PluginState } from "../../app/types";
import { renderActionButtons } from "../components/action-buttons";
import { renderCurveEditor } from "../components/curve-editor";
import { renderEasingPresets } from "../components/easing-presets";
import { renderKeyframePanel } from "../components/keyframe-panel";
import { renderPropertySelector } from "../components/property-selector";

export function renderMotionScreen(state: PluginState): string {
  return `<section class="motion-workspace" aria-label="Motion workspace">
    ${renderPropertySelector(state.property)}
    ${renderCurveEditor(state.curve)}
    ${renderEasingPresets(state.easing)}
    ${renderActionButtons()}
    ${renderKeyframePanel()}
  </section>`;
}

