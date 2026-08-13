/** A normalized animation time or progress value. Runtime policy clamps it to [0, 1]. */
export type NormalizedTime = number;

/** A finite non-negative animation duration measured in caller-defined time units. */
export type Duration = number;

/** A finite number used as a value in the host-independent motion core. */
export type Scalar = number;

/**
 * A vector-like motion value. The core deliberately uses a plain numeric sequence
 * so it can represent 2D, 3D, and future vector-like values without host types.
 */
export type VectorValue = readonly number[];

export type MotionValue = Scalar | VectorValue;

export type EasingDirection = "in" | "out" | "inOut";
export type EasingKind =
  | "linear"
  | "ease"
  | "quad"
  | "cubic"
  | "quart"
  | "quint"
  | "sine"
  | "expo"
  | "circ"
  | "back";

export interface EasingConfiguration {
  kind: EasingKind;
  direction?: EasingDirection;
}

export interface Keyframe<T extends MotionValue = MotionValue> {
  time: Duration;
  value: T;
  easing?: EasingConfiguration;
}

export interface KeyframeSequence<T extends MotionValue = MotionValue> {
  keyframes: readonly Keyframe<T>[];
}

export interface EasingFunction {
  readonly name: string;
  evaluate(time: NormalizedTime): number;
}

export interface MotionCurveDefinition<T extends MotionValue> {
  startValue: T;
  endValue: T;
  duration: Duration;
  easing: EasingFunction;
}
