# NotFakePlugdAll

Professional motion-design workflow plugin for Adobe Premiere Pro UXP.

## Current milestone

Phase 1 implements the responsive UI shell only. It contains no Premiere API calls, no keyframe access, and no motion-engine mathematics.

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

