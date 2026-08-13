import type { PluginState } from "../app/types";
import { CubicBezier } from "../core/motion/bezier/cubic-bezier";
import { allEasings } from "../core/motion/easing";
import { MotionCurve } from "../core/motion/motion-curve";
import type { EasingFunction } from "../core/motion/models";

export class PreviewController {
  private isPlaying = false;
  private progress = 0; // 0 to 1
  private lastTime = 0;
  private animationFrameId: number | null = null;
  private durationMs = 1500; // 1.5 seconds

  // DOM Elements
  private previewBox: HTMLElement | null = null;
  private playhead: HTMLElement | null = null;
  private stage: HTMLElement | null = null;
  private previewBtn: HTMLElement | null = null;

  constructor(private getState: () => PluginState) {}

  public attach(root: HTMLElement) {
    this.previewBox = root.querySelector(".preview-box");
    this.playhead = root.querySelector(".timeline-playhead");
    this.stage = root.querySelector(".preview-stage");
    this.previewBtn = root.querySelector("[data-action='preview']");
    this.updateVisuals();
  }

  public detach() {
    this.pause();
    this.previewBox = null;
    this.playhead = null;
    this.stage = null;
    this.previewBtn = null;
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play() {
    if (this.isPlaying) return;
    if (this.progress >= 1) this.progress = 0; // reset if at end
    this.isPlaying = true;
    this.lastTime = performance.now();
    this.updateButtonText();
    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  public pause() {
    this.isPlaying = false;
    this.updateButtonText();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public reset() {
    this.pause();
    this.progress = 0;
    this.updateVisuals();
  }

  public scrub(progress: number) {
    this.pause();
    this.progress = Math.max(0, Math.min(1, progress));
    this.updateVisuals();
  }

  public syncWithStateChange() {
    // When Bezier or Preset changes, we update visual if paused to reflect new easing at current progress
    this.updateVisuals();
  }

  private loop(time: number) {
    if (!this.isPlaying) return;
    
    const delta = time - this.lastTime;
    this.lastTime = time;
    
    this.progress += delta / this.durationMs;
    
    if (this.progress >= 1) {
      this.progress = 1;
      this.pause();
    }
    
    this.updateVisuals();
    
    if (this.isPlaying) {
      this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  private updateVisuals() {
    const state = this.getState();
    let easingFn: EasingFunction;
    
    if (state.easing === "custom") {
      easingFn = new CubicBezier(state.curve);
    } else if (state.easing === "smooth") {
      easingFn = allEasings.easeInOut;
    } else if (state.easing === "bounce") {
      easingFn = allEasings.bounceOut;
    } else if (state.easing === "elastic") {
      easingFn = allEasings.elasticOut;
    } else if (state.easing === "spring") {
      easingFn = allEasings.springOut;
    } else {
      easingFn = allEasings.linear;
    }

    let easedValue = 0;
    
    // Evaluate based on progress
    if (state.extractedMotion && state.extractedMotion.keyframes.length >= 2) {
      // Use extracted timing for local preview
      const kfs = state.extractedMotion.keyframes;
      const startKey = kfs[0];
      const endKey = kfs[kfs.length - 1];
      const totalDuration = endKey.time - startKey.time;
      const currentTime = startKey.time + totalDuration * this.progress;
      
      // Find the segment
      let segmentStart = startKey;
      let segmentEnd = endKey;
      for (let i = 0; i < kfs.length - 1; i++) {
        if (currentTime >= kfs[i].time && currentTime <= kfs[i + 1].time) {
          segmentStart = kfs[i];
          segmentEnd = kfs[i + 1];
          break;
        }
      }
      
      const segmentDuration = segmentEnd.time - segmentStart.time;
      let segmentProgress = segmentDuration > 0 ? (currentTime - segmentStart.time) / segmentDuration : 1;
      
      const curve = new MotionCurve({
        startValue: 0, // We just visualize progress in the box, not actual coordinate
        endValue: 1,
        duration: 1,
        easing: easingFn
      });
      easedValue = curve.evaluate(segmentProgress);
    } else {
      const curve = new MotionCurve({
        startValue: 0,
        endValue: 1,
        duration: 1,
        easing: easingFn
      });
      easedValue = curve.evaluate(this.progress);
    }

    if (this.previewBox && this.stage) {
      const stageWidth = this.stage.clientWidth - 16; // 8px padding each side
      const boxWidth = this.previewBox.clientWidth;
      const travel = stageWidth - boxWidth;
      this.previewBox.style.transform = `translateX(${travel * easedValue}px)`;
    }

    if (this.playhead) {
      // Playhead ranges from 14% to 86% -> range is 72%
      const left = 14 + (72 * this.progress);
      this.playhead.style.left = `${left}%`;
    }
  }

  private updateButtonText() {
    if (this.previewBtn) {
      this.previewBtn.textContent = this.isPlaying ? "PAUSE" : "PLAY";
    }
  }
}
