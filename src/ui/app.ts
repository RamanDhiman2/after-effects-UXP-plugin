import { MockMotionController } from "../app/mock-motion-controller";
import type { EasingPreset, ScreenId } from "../app/types";
import { renderHeader } from "./components/header";
import { renderNavigation } from "./components/navigation";
import { renderStatusBar } from "./components/status-bar";
import { renderMotionScreen } from "./screens/motion-screen";
import { renderPlaceholderScreen } from "./screens/placeholder-screen";

export function mountApp(root: HTMLElement): void {
  const controller = new MockMotionController();
  const render = () => {
    const state = controller.getState();
    const screen = state.activeScreen === "motion"
      ? renderMotionScreen(state)
      : renderPlaceholderScreen(state.activeScreen);
    root.innerHTML = `<div class="plugin-shell">${renderHeader()}${renderNavigation(state.activeScreen)}<div class="screen-content">${screen}</div>${renderStatusBar(state.status)}</div>`;
  };

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const screen = target.closest<HTMLElement>("[data-screen]")?.dataset.screen as ScreenId | undefined;
    if (screen) controller.selectScreen(screen);

    const easing = target.closest<HTMLElement>("[data-easing]")?.dataset.easing as EasingPreset | undefined;
    if (easing) controller.selectEasing(easing);

    const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
    if (action === "preview") controller.preview();
    if (action === "apply") controller.apply();

    const keyframeAction = target.closest<HTMLElement>("[data-keyframe-action]")?.dataset.keyframeAction as "extract" | "link" | "reset" | undefined;
    if (keyframeAction) controller.mockKeyframeAction(keyframeAction);
  });

  root.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (target.matches("[data-action='property']")) controller.selectProperty(target.value);
    const curveControl = target.dataset.curveControl as "x1" | "y1" | "x2" | "y2" | undefined;
    if (curveControl) controller.updateCurve(curveControl, Number(target.value));
  });

  controller.subscribe(render);
  render();
}

