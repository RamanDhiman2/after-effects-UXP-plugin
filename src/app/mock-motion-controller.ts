import type { CurveControls, EasingPreset, PluginState, ScreenId } from "./types";
import {
  CUBIC_BEZIER_DEFAULT_CONTROLS,
  createCubicBezierControls,
  updateCubicBezierControlPoint,
  type BezierPoint,
  type CubicBezierControlPointId
} from "../core/motion";

type StateListener = (state: PluginState) => void;

const initialState: PluginState = {
  activeScreen: "motion",
  property: "Position",
  curve: { ...CUBIC_BEZIER_DEFAULT_CONTROLS },
  easing: "smooth",
  status: { kind: "ready", message: "READY" }
};

function cloneState(state: PluginState): PluginState {
  return {
    ...state,
    curve: { ...state.curve },
    status: { ...state.status }
  };
}

/**
 * Local controller. It owns UI state and Motion Core validation, but deliberately
 * has no host adapter and never reads or writes Premiere project data.
 */
export class MockMotionController {
  private state: PluginState = cloneState(initialState);
  private listeners = new Set<StateListener>();

  public getState(): PluginState {
    return cloneState(this.state);
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public selectScreen(activeScreen: ScreenId): void {
    this.update({ activeScreen });
  }

  public selectProperty(property: string): void {
    this.update({ property });
  }

  public updateCurve(control: keyof CurveControls, value: number): void {
    this.updateCurveValue(control, value, true);
  }

  public updateCurvePoint(
    pointId: CubicBezierControlPointId,
    point: BezierPoint,
    options: { notify?: boolean } = {}
  ): CurveControls {
    const curve = updateCubicBezierControlPoint(this.state.curve, pointId, point);
    this.setCurve(curve, options.notify ?? true);
    return curve;
  }

  public resetCurve(): void {
    this.setCurve(CUBIC_BEZIER_DEFAULT_CONTROLS, true);
  }

  public commitCurveInteraction(): void {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  public selectEasing(easing: EasingPreset): void {
    this.update({ easing, status: { kind: "ready", message: `${easing.toUpperCase()} SELECTED` } });
  }

  public preview(): void {
    this.update({ status: { kind: "preview", message: "PREVIEW READY" } });
  }

  public apply(): void {
    this.update({ status: { kind: "warning", message: "APPLY DISABLED — Motion Engine Not Connected" } });
  }

  public mockKeyframeAction(action: "extract" | "link" | "reset"): void {
    const status = action === "reset"
      ? { kind: "ready" as const, message: "TIMELINE RESET — UI ONLY" }
      : { kind: "warning" as const, message: `${action.toUpperCase()} UNAVAILABLE — Premiere Not Connected` };
    this.update({ status });
  }

  private updateCurveValue(control: keyof CurveControls, value: number, notify: boolean): CurveControls | undefined {
    if (!Number.isFinite(value)) return undefined;
    const curve = createCubicBezierControls({ ...this.state.curve, [control]: value });
    this.setCurve(curve, notify);
    return curve;
  }

  private setCurve(curve: CurveControls, notify: boolean): void {
    this.update({ curve: { ...curve }, easing: "custom" }, notify);
  }

  private update(change: Partial<PluginState>, notify = true): void {
    this.state = { ...this.state, ...change };
    if (!notify) return;
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
