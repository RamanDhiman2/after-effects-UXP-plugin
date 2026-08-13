import { interpolateValue, type MotionValue } from "../core/motion";

export interface ExtractedKeyframe {
  time: number; // in ticks
  value: number | number[];
}

export interface ExtractedMotion {
  property: string;
  keyframes: ExtractedKeyframe[];
  timebase: number;
}

declare const require: any;

export class PremiereAdapter {
  private getApp() {
    try {
      return require("premierepro").app;
    } catch {
      return null;
    }
  }

  private getSelectedProperty(propertyName: string) {
    const app = this.getApp();
    if (!app || !app.project || !app.project.activeSequence) {
      throw new Error("No active sequence.");
    }
    
    const selection = app.project.activeSequence.getSelection();
    if (!selection || selection.length === 0) {
      throw new Error("No clip selected.");
    }
    
    const clip = selection[0];
    if (!clip.components) {
      throw new Error("Selected clip has no components.");
    }
    
    for (let i = 0; i < clip.components.length; i++) {
      const comp = clip.components[i];
      if (comp.properties) {
        for (let j = 0; j < comp.properties.length; j++) {
          const prop = comp.properties[j];
          if (prop.name === propertyName || prop.displayName === propertyName) {
            return { clip, property: prop, timebase: app.project.activeSequence.timebase };
          }
        }
      }
    }
    throw new Error(`Property ${propertyName} not found on selected clip.`);
  }

  public extractKeyframes(propertyName: string): ExtractedMotion {
    const target = this.getSelectedProperty(propertyName);
    const keys = target.property.getKeys();
    
    if (!keys || keys.length === 0) {
      throw new Error("No keyframes found.");
    }
    
    const keyframes: ExtractedKeyframe[] = [];
    for (let i = 0; i < keys.length; i++) {
      const time = keys[i].ticks ? Number(keys[i].ticks) : Number(keys[i]);
      const value = target.property.getValueAtKey(keys[i]);
      keyframes.push({ time, value });
    }
    
    return {
      property: propertyName,
      keyframes,
      timebase: Number(target.timebase || 254016000000)
    };
  }

  public applyBakedMotion(propertyName: string, bakedSamples: { time: number, value: MotionValue }[]): void {
    const target = this.getSelectedProperty(propertyName);
    
    // Clear existing keyframes in the baked range
    if (bakedSamples.length > 0) {
      const startTime = bakedSamples[0].time;
      const endTime = bakedSamples[bakedSamples.length - 1].time;
      const keys = target.property.getKeys();
      for (let i = 0; i < keys.length; i++) {
        const t = keys[i].ticks ? Number(keys[i].ticks) : Number(keys[i]);
        if (t >= startTime && t <= endTime) {
          target.property.removeKey(keys[i]);
        }
      }
    }

    // Insert baked keyframes
    for (const sample of bakedSamples) {
      // In Premiere UXP, time is often passed as an object or a tick string
      // Try to pass ticks as string since that's a common UXP pattern
      const timeArg = String(sample.time);
      target.property.addKey(timeArg);
      target.property.setValueAtKey(sample.value, timeArg, true);
      // setInterpolationTypeAtKey: 0 = Linear
      if (typeof target.property.setInterpolationTypeAtKey === "function") {
        target.property.setInterpolationTypeAtKey(timeArg, 0);
      }
    }
  }
}
