export type ScreenId = "motion" | "presets" | "ai" | "settings";
export type EasingPreset = "smooth" | "bounce" | "elastic" | "spring" | "custom";
export type StatusKind = "ready" | "preview" | "warning" | "error";

export interface CurveControls {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PluginState {
  activeScreen: ScreenId;
  property: string;
  curve: CurveControls;
  easing: EasingPreset;
  status: {
    kind: StatusKind;
    message: string;
  };
  extractedMotion?: { property: string; keyframes: { time: number; value: number | readonly number[] }[]; timebase: number } | null;
  bakedSamples?: { time: number; value: number | readonly number[] }[] | null;
}
