# NotFakePlugdAll — Codex Project Instructions

## Project
Production-grade commercial motion graphics plugin.
Primary target: Adobe Premiere Pro 2025–2026 using modern Premiere UXP.

## Vision
Build a unified motion workflow tool with:
- Custom easing curves
- Cubic Bezier graph editor
- Real-time local preview
- Ease In/Out/In-Out
- Bounce, Elastic, Spring
- Keyframe extraction/application
- Keyframe synchronization
- Diagnostics
- Keyframe Guardian
- Safe Mode
- Snapshot/verification/rollback
- Presets
- Host capability detection
- Professional responsive UI

Future only:
- C++ / UXP Hybrid
- AI Assistant
- MCP
- Licensing/account backend
- After Effects adapter
- OFX/Resolve adapter
- Separate legacy Premiere edition

## Roles
ChatGPT = architect/project planner/reviewer.
Codex = primary implementation engineer.

Codex creates/modifies files, writes tests, runs builds/tests, fixes implementation errors, and reports changed files and risks.

## Architecture
UI
  ↓
Application/Controller
  ↓
Host-independent Motion Core
  ↓
Premiere UXP Adapter
  ↓
Premiere Pro

Motion Core MUST NOT contain Premiere-specific logic.

Future:
Shared Motion Core
  ├── Premiere UXP Adapter
  ├── After Effects Adapter
  └── OFX Adapter

## Initial stack
- TypeScript
- HTML
- CSS
- Premiere UXP
- Node.js/npm
- Git

Future:
- C++
- CMake
- UXP Hybrid

Do NOT add C++, AI APIs, licensing/backend, Python core, React, or other unnecessary dependencies unless explicitly requested and technically justified.

## Development rules
1. One milestone at a time.
2. Inspect the repo before editing.
3. Never rewrite the whole project unnecessarily.
4. Prefer modular, typed code.
5. Add tests for important math.
6. Keep motion calculations deterministic.
7. Keep UI responsive.
8. Never silently mutate Premiere project data.
9. Preview should be local/non-destructive whenever possible.
10. Host mutations happen only through the Premiere adapter.
11. Validate before applying.
12. Read back and verify after applying.
13. Maintain rollback/snapshot strategy.
14. Important bugs become regression tests.

## Premiere API rule
NEVER invent Premiere APIs.
If an API is uncertain, check current official Adobe Premiere UXP documentation, identify supported version/capability, isolate it in the host adapter, and report limitations if unsupported. Do not copy unverified old tutorials blindly.

## Target versions
Primary: Premiere Pro 2025 and 2026.
Premiere 2023/2024 are not initial targets. A separate legacy edition may come later.

## Build order
1. UXP foundation
2. Professional UI
3. Motion data model
4. Basic easing engine
5. Bezier editor
6. Real-time preview
7. Bounce
8. Elastic
9. Spring
10. Premiere keyframe extraction
11. Premiere keyframe application
12. Read-back verification
13. Keyframe Guardian
14. Safe Mode
15. Snapshot/rollback
16. Presets
17. Capability detection
18. Performance profiling
19. C++ Hybrid if justified
20. Beta testing
21. Commercial packaging
22. Licensing/account
23. AI Assistant
24. MCP
25. Future host adapters

Do not implement future features early.

## UI
Professional editing-tool feel:
- fast
- clean
- compact
- readable
- responsive
- clear status
- minimal decoration

Navigation:
Motion | Presets | AI | Settings

Motion screen:
- host status
- property selector
- curve graph
- numeric controls
- easing presets
- preview
- apply
- keyframe section
- diagnostics/status

AI and Settings can initially be placeholders.

## Motion Core
Normalized t is normally [0,1].
Standard normalized easing should satisfy f(0)=0 and f(1)=1 unless intentionally overshooting.

value(t) = start + f(t) * (end - start)

Initial order:
Linear
Ease In
Ease Out
Ease In-Out
Quad
Cubic
Quart
Quint
Sine
Expo
Circ
Back
Cubic Bezier
Bounce
Elastic
Spring

Every math module gets unit tests.

## Bezier
P0=(0,0), P1/P2 controls, P3=(1,1).
Requirements:
- draggable controls
- X1/Y1/X2/Y2 inputs
- live graph
- reset
- copy values
- deterministic evaluator
- boundary tests

## Bounce
Use a parametric model, not a hard-coded keyframe list.

Parameters:
- bounceCount
- elasticity
- gravity
- damping/friction
- frequency
- restThreshold

Typical design target:
2–5 bounces; first rebound ~60–70%; second ~35–40%; third ~15–20%; then micro-bounces settle.
Validate visually/tests rather than forcing arbitrary values.

## Safe apply
PRE-CHECK → SNAPSHOT → VALIDATE → APPLY → READ BACK → COMPARE → COMMIT

If verification fails:
- abort if possible
- rollback when supported
- show clear error
- never claim success silently

## Presets
Use versioned JSON. Example:

{
  "schema": 1,
  "id": "bounce.classic",
  "name": "Classic Bounce",
  "type": "bounce",
  "parameters": {
    "count": 3,
    "elasticity": 0.65,
    "gravity": 1.0,
    "damping": 0.70
  },
  "targets": ["position", "scale"]
}

Support future migration.

## Future AI
Core plugin MUST work without AI/internet.

Future:
AI Provider
  ├── OpenAI
  ├── Claude
  ├── Gemini
  └── Local model

AI should produce intent/parameters; deterministic Motion Core calculates the actual curve.

## Future MCP
MCP is a controlled AI-to-tools/context layer.
Possible tools:
- get_selected_clip
- get_motion_properties
- get_keyframes
- preview_curve
- create_curve
- apply_curve
- create_preset
- undo_last_operation

Preferred flow:
AI → tool validation → preview → user approval → Premiere mutation.

## Future licensing
Core motion calculations stay offline.
Later commercial system may include account, license key, device activation, signed/local entitlement, offline grace period and periodic revalidation.
Never hard-code master secrets in the client.

## Testing
Unit:
- easing
- Bezier
- bounce
- elastic
- spring
- serialization

Integration:
- extraction
- MotionModel conversion
- apply
- read-back verification

Regression:
Every important bug gets a reproducible test.

Golden fixtures eventually include:
simple motion, multiple keyframes, position+scale, anchor cases, short durations, 1080x1920, 1080x1080, 4K, and other supported edge cases.

## Git
Use:
main
develop
feature/*
fix/*

Example commits:
- feat: add UXP panel foundation
- feat: add easing engine
- feat: add bezier curve editor
- feat: add keyframe extraction
- fix: prevent invalid curve input

Keep commits small and meaningful.

## Codex task protocol
For every task:
1. Inspect repo.
2. Briefly explain intended changes.
3. Implement only requested scope.
4. Run tests/build.
5. Report changed files.
6. Report failures.
7. Report risks.
8. Stop.

Never start unrelated features.

## Current state
Until a separate task is provided, do not implement product features.
