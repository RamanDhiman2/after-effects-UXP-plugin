import { MockMotionController } from "../app/mock-motion-controller";
import type { EasingPreset, ScreenId } from "../app/types";
import { renderHeader } from "./components/header";
import { renderNavigation } from "./components/navigation";
import { renderStatusBar } from "./components/status-bar";
import { bindCurveEditor } from "./components/curve-editor";
import { renderMotionScreen } from "./screens/motion-screen";
import { renderPlaceholderScreen } from "./screens/placeholder-screen";
import { PreviewController } from "./preview-controller";

function closestElement(target: EventTarget | null, selector: string): HTMLElement | null {
  let element = target as HTMLElement | null;
  while (element) {
    if (typeof element.matches === "function" && element.matches(selector)) return element;
    element = element.parentElement;
  }
  return null;
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message.slice(0, 160);
  return "Unknown rendering error";
}

function renderApplicationFallback(message: string): string {
  return `<div class="plugin-shell">${renderHeader()}<div class="screen-content">
    <section class="render-error panel-section" role="alert">
      <h2>Motion workspace failed to load.</h2>
      <p>Error: ${message}</p>
      <button class="button button--secondary" type="button" data-action="reload-panel">RELOAD PANEL</button>
    </section>
  </div>${renderStatusBar({ kind: "error", message: "ERROR" })}</div>`;
}

export function mountApp(root: HTMLElement): void {
  const controller = new MockMotionController();
  const previewController = new PreviewController(() => controller.getState());
  
  const render = () => {
    previewController.detach();
    try {
      const state = controller.getState();
      const screen = state.activeScreen === "motion"
        ? renderMotionScreen(state)
        : renderPlaceholderScreen(state.activeScreen);
      root.innerHTML = `<div class="plugin-shell">${renderHeader()}${renderNavigation(state.activeScreen)}<div class="screen-content">${screen}</div>${renderStatusBar(state.status)}</div>`;
      bindCurveEditor(root, controller, () => previewController.syncWithStateChange());
      if (state.activeScreen === "motion") {
        previewController.attach(root);
      }
    } catch (error) {
      root.innerHTML = renderApplicationFallback(safeErrorMessage(error));
    }
  };

  root.addEventListener("click", (event) => {
    const screen = closestElement(event.target, "[data-screen]")?.getAttribute("data-screen") as ScreenId | undefined;
    if (screen) controller.selectScreen(screen);

    const easing = closestElement(event.target, "[data-easing]")?.getAttribute("data-easing") as EasingPreset | undefined;
    if (easing) controller.selectEasing(easing);

    const action = closestElement(event.target, "[data-action]")?.getAttribute("data-action");
    if (action === "preview") previewController.togglePlay();
    if (action === "apply") controller.apply();
    if (action === "reset-curve") controller.resetCurve();
    if (action === "reload-panel") render();

    const keyframeAction = closestElement(event.target, "[data-keyframe-action]")?.getAttribute("data-keyframe-action") as "extract" | "link" | "reset" | undefined;
    if (keyframeAction) {
      if (keyframeAction === "reset") previewController.reset();
      controller.mockKeyframeAction(keyframeAction);
    }

    const timeline = closestElement(event.target, ".mock-timeline");
    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      const clickX = (event as MouseEvent).clientX - rect.left;
      const startX = rect.width * 0.14;
      const range = rect.width * 0.72;
      const progress = (clickX - startX) / range;
      previewController.scrub(progress);
    }
  });

  root.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (typeof target.matches === "function" && target.matches("[data-action='property']")) controller.selectProperty(target.value);
    const curveControl = target.getAttribute("data-curve-control") as "x1" | "y1" | "x2" | "y2" | null;
    if (curveControl) controller.updateCurve(curveControl, Number(target.value));
  });

  root.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement;
    const curveControl = target.getAttribute("data-curve-control") as "x1" | "y1" | "x2" | "y2" | null;
    if (!curveControl || target.value.trim() === "") return;
    controller.updateCurve(curveControl, Number(target.value));
  });

  controller.subscribe(render);
  render();
}
