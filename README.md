# NotFakePlugdAll

Professional motion-design workflow plugin for Adobe Premiere Pro UXP.

## Current milestone

Phase 1 implements the responsive UI shell only. It contains no Premiere API calls and no keyframe access.

Phase 2 adds a host-independent Motion Core under `src/core/motion`. It has no UXP or Premiere dependency, no UI integration, and no host mutation path. Normalized time and interpolation progress are clamped to `[0, 1]`; non-finite inputs are rejected. Back easings intentionally overshoot their output range, while zero-duration curves immediately evaluate to their end value.

Phase 3 replaces the mock curve with a real Cubic-Bezier editor. Bezier mathematics live in Motion Core, while the UI only handles SVG rendering and local editor interaction. Curve X controls are clamped to `[0, 1]`; Y controls are clamped to `[-2, 2]` so future overshoot curves remain representable without allowing broken values.

The editor uses simple inline SVG primitives instead of SVG pattern/defs features, keeping the graph friendlier to Premiere UXP's limited SVG renderer. The app also includes a lightweight render fallback so component errors show a visible panel error instead of a blank workspace.

## Local commands

Use the `.cmd` variants on this Windows machine because PowerShell blocks the `npm.ps1` shim:

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Then add `manifest.json` to Adobe UXP Developer Tool and choose **Load & Watch** with Premiere running.
