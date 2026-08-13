import type { CurveControls, EasingPreset, PluginState, ScreenId } from "./types";

type StateListener = (state: PluginState) => void;

const initialState: PluginState = {
  activeScreen: "motion",
  property: "Position",
  curve: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
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
 * UI-only controller. Future phases may connect it to motion-core and an adapter,
 * but this phase deliberately never reads or writes Premiere project data.
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
    if (!Number.isFinite(value)) return;
    this.update({ curve: { ...this.state.curve, [control]: value } });
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

  private update(change: Partial<PluginState>): void {
    this.state = { ...this.state, ...change };
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
