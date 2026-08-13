import type { CurveControls, EasingPreset, PluginState, ScreenId } from "./types";
import {
  CUBIC_BEZIER_DEFAULT_CONTROLS,
  createCubicBezierControls,
  updateCubicBezierControlPoint,
  CubicBezier,
  MotionCurve,
  allEasings,
  type BezierPoint,
  type CubicBezierControlPointId,
  type MotionValue
} from "../core/motion";
import { PremiereAdapter, type ExtractedMotion } from "./premiere-adapter";

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

  private adapter = new PremiereAdapter();
  private extractedMotion: ExtractedMotion | null = null;
  private bakedSamples: { time: number; value: MotionValue }[] | null = null;

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
    if (this.state.extractedMotion) {
      this.update({ status: { kind: "preview", message: "READY TO PREVIEW" } });
    } else {
      this.update({ status: { kind: "preview", message: "PREVIEW READY" } });
    }
  }

  public apply(): void {
    try {
      if (!this.state.extractedMotion) {
        throw new Error("NO KEYFRAMES EXTRACTED");
      }

      this.update({ status: { kind: "ready", message: "BAKING MOTION..." } }, true);

      // Perform baking
      const ticksPerFrame = this.state.extractedMotion.timebase;
      const kfs = this.state.extractedMotion.keyframes;
      if (kfs.length < 2) {
        throw new Error("AT LEAST 2 KEYFRAMES REQUIRED");
      }

      const samples: { time: number; value: MotionValue }[] = [];
      
      // Calculate easing function
      let easingFn;
      if (this.state.easing === "custom") easingFn = new CubicBezier(this.state.curve);
      else if (this.state.easing === "smooth") easingFn = allEasings.easeInOut;
      else if (this.state.easing === "bounce") easingFn = allEasings.bounceOut;
      else if (this.state.easing === "elastic") easingFn = allEasings.elasticOut;
      else if (this.state.easing === "spring") easingFn = allEasings.springOut;
      else easingFn = allEasings.linear;

      for (let i = 0; i < kfs.length - 1; i++) {
        const startKey = kfs[i];
        const endKey = kfs[i + 1];
        
        const duration = endKey.time - startKey.time;
        if (duration <= 0) continue;

        const curve = new MotionCurve({
          startValue: startKey.value as MotionValue,
          endValue: endKey.value as MotionValue,
          duration: duration,
          easing: easingFn
        });

        // Evaluate at every sequence frame
        for (let time = startKey.time; time < endKey.time; time += ticksPerFrame) {
          const t = time - startKey.time;
          samples.push({ time, value: curve.evaluate(t) });
        }
      }
      
      // Ensure the very last keyframe is added exactly
      const lastKey = kfs[kfs.length - 1];
      samples.push({ time: lastKey.time, value: lastKey.value as MotionValue });

      this.update({ bakedSamples: samples });
      this.adapter.applyBakedMotion(this.state.extractedMotion.property, samples);
      
      this.update({ status: { kind: "ready", message: `APPLIED — ${samples.length} KEYFRAMES` } });
    } catch (err: any) {
      this.update({ status: { kind: "error", message: err.message || "ERROR" } });
    }
  }

  public mockKeyframeAction(action: "extract" | "link" | "reset"): void {
    if (action === "extract") {
      try {
        const extractedMotion = this.adapter.extractKeyframes(this.state.property);
        this.update({ extractedMotion, status: { kind: "ready", message: "KEYFRAMES EXTRACTED" } });
      } catch (err: any) {
        const msg = err.message || "ERROR";
        this.update({ extractedMotion: null, bakedSamples: null });
        if (msg.includes("No active sequence") || msg.includes("No clip selected")) {
          this.update({ status: { kind: "warning", message: "NO CLIP SELECTED" } });
        } else if (msg.includes("No keyframes")) {
          this.update({ status: { kind: "warning", message: "NO KEYFRAMES" } });
        } else {
          this.update({ status: { kind: "error", message: msg } });
        }
      }
    } else if (action === "reset") {
      this.update({ status: { kind: "ready", message: "TIMELINE RESET — UI ONLY" } });
    } else {
      this.update({ status: { kind: "warning", message: `${action.toUpperCase()} UNAVAILABLE` } });
    }
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
