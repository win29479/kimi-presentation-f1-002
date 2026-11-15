# Test Infrastructure: Kimi Antonelli 3D Experience (Dual-Track E2E)

This document specifies the end-to-end testing infrastructure, execution harness, and test tier hierarchy for the Kimi Antonelli 3D F1 Driver Experience website revamp.

---

## 1. Architecture & Design Principles

The testing track runs in parallel with feature implementation, providing an objective, independent verification harness built upon the following principles:

1. **Opaque-Box Testing**: Tests are designed around external user specifications, interface contracts (`PROJECT.md`), and historical racing facts, rather than internal implementation quirks.
2. **Deterministic & Dependency-Free**: The runner executes directly in modern Node.js (`v26.4.0` / standard ESM/CJS) without requiring heavy headless browser daemons or external test framework dependencies.
3. **Zero-Facade Policy**: Facade tests that always pass or contain no real assertions are strictly forbidden. All assertions evaluate mathematical models, binary asset headers, DOM structure, regex audits, or data invariants.
4. **Progressive Testability**: Tests validate specifications and contracts independently, verifying both mathematical/contractual invariants and target filesystem artifacts as milestones complete.
5. **Granular Tier Execution**: The runner supports running the entire test suite or isolating individual tiers via the `--tier <N>` CLI flag.

---

## 2. Test Runner Architecture (`tests/runner.js`)

The test runner provides a lightweight, robust test execution harness:

- **Entrypoint**: `tests/runner.js`
- **CLI Commands**:
  - `node tests/runner.js` — Runs all 4 test tiers (Tiers 1–4)
  - `node tests/runner.js --tier 1` — Runs Tier 1 only (Feature Coverage)
  - `node tests/runner.js --tier 2` — Runs Tier 2 only (Boundary & Corner Cases)
  - `node tests/runner.js --tier 3` — Runs Tier 3 only (Cross-Feature Interactions)
  - `node tests/runner.js --tier 4` — Runs Tier 4 only (Real-World Application Scenarios)
  - `node tests/runner.js --verbose` — Verbose failure stack traces
  - `npm test` — Configured in `package.json` to invoke `node tests/runner.js`
- **Exit Code Semantics**:
  - `0`: All executed tests passed cleanly.
  - `1`: One or more tests failed.
- **Reporting**:
  - Real-time ANSI colored terminal output with pass (`✓`) and fail (`✗`) markers.
  - Per-tier execution summary with total tests, passed, failed, and elapsed duration.
  - Final grand summary table reporting total suite status.

---

## 3. Tier Hierarchy & Scope

```
+------------------------------------------------------------------------+
|                      E2E TEST HARNESS SUITE                            |
+------------------------------------------------------------------------+
  |
  +--> Tier 1: Feature Coverage (>=50 tests)
  |      [React Scaffolding, 3D Helmet Default, Hover Reveal, Leave Restore,
  |       WebGL Fallback, 7 Milestones, Alternating Timeline, 12 Photos,
  |       Responsive Adaptation, Driver Telemetry]
  |
  +--> Tier 2: Boundary & Corner Cases (>=25 tests)
  |      [Zero AI Images Audit, 767px vs 768px Viewport Thresholds,
  |       Hover Reveal Bounds Clamp [0, 1], prefers-reduced-motion,
  |       WebGL Context Loss Fallback, Aspect Ratios & Alpha Transparency]
  |
  +--> Tier 3: Cross-Feature Interactions (>=15 tests)
  |      [Hover Reveal During Scroll Velocity, Timeline Node Activation On
  |       Anchor Jump, Fallback Card Under Viewport Resize, Design System
  |       Token Consistency, Milestone-Photo Integration]
  |
  +--> Tier 4: Real-World Application Scenarios (>=8 tests)
         [Complete Driver Journey Flow 2014->2026, Complete 12 Authentic
          Photo Mapping Chain, Site DOM Integrity & Accessibility,
          Asset Loading & Network Resilience]
```

### Tier 1: Feature Coverage (`tests/tier1_features.test.js`)
Validates the primary functional behavior of each feature in isolation:
- **Scaffolding & Tooling**: `package.json` structure, scripts, module type, `index.html` mount point.
- **3D Helmet Default State**: Closed reflective visor, full shell opacity (`1.0`), hidden face (`0.0`), active idle drift.
- **3D Helmet Hover Reveal**: Pointerenter trigger, smooth opacity dissolution (`1.0` -> `0.08`), face opacity reveal (`0.0` -> `1.0`).
- **3D Helmet Leave Restore**: Pointerleave trigger, smooth restoration back to closed helmet shell and visor (`0.08` -> `1.0`).
- **WebGL Fallback Card**: Feature detection via `useWebGLSupport`, 2.5D interactive card cross-fading cockpit photo to portrait.
- **7 Career Milestones Data**: Exact verified historical facts across 7 epochs (2014 Grassroots to 2026 Title Horizon).
- **Alternating Timeline Layout**: Odd items left, even items right, central glowing spine at 50%, illuminated connector nodes.
- **12 Authentic Photos Catalog**: Verified mapping of all 12 user-uploaded reference photos in `KIMI_IMAGES`.
- **Driver Telemetry & Stats**: 4 championships, 32+ wins, permanent car number #12, journey diptych.

### Tier 2: Boundary & Corner Cases (`tests/tier2_boundary.test.js`)
Validates application resilience under edge conditions, limits, and environmental variations:
- **Zero AI Images Audit**: Comprehensive regex audit preventing reintroduction of legacy base64 AI strings (`AI_PORTRAIT_DATA_URL`, `AI_HELMET_DATA_URL`, `AI_EXTRA_ASSETS`).
- **Responsive Thresholds (767px vs 768px)**: Exact layout transition boundary between single-column mobile collapse and alternating desktop layout.
- **Bounds Clamping [0.0, 1.0]**: Rapid pointer oscillation tests ensuring `revealFactor` is strictly clamped with zero numerical overshoot or NaN.
- **`prefers-reduced-motion` Compliance**: Complete suppression of rotational drift and slide-in translations when reduced motion is requested.
- **WebGL Context Loss/Throw**: Simulated context destruction and initialization throw gracefully routed to fallback card without crashing.
- **Photo Aspect Ratios & Alpha Preservation**: Binary header checks ensuring 8-bit RGBA alpha channels are preserved on portraits.

### Tier 3: Cross-Feature Interactions (`tests/tier3_combinations.test.js`)
Validates that multiple subsystems interact seamlessly without race conditions or visual breakage:
- **Hover Reveal During Scroll Velocity**: Hover transitions remain smooth and responsive even under rapid viewport scrolling.
- **Timeline Node Activation on Anchor Jump**: Navigation jumps (`#timeline`, `#stats`) correctly trigger node illumination and active state.
- **Fallback Card Under Viewport Resize**: Responsive width resizing while in WebGL fallback mode preserves proper card geometry and cross-fade.
- **Design System Token Consistency**: CSS variables in `tokens.css` maintain WCAG AAA contrast ratios (17:1+ for text, 9:1+ for cyan accents).
- **Milestone-Photo Integration**: 1-to-1 integrity between milestone records and authentic catalog keys.

### Tier 4: Real-World Scenarios (`tests/tier4_realworld.test.js`)
Validates cohesive end-to-end user journeys and system integrity:
- **Complete Driver Journey Flow**: Chronological narrative progression from Hero #12 through all 7 milestones to the 2026 World Champion card.
- **12 Authentic Photo Mapping Chain**: Exhaustive verification that 100% of the 12 uploaded reference photos are utilized in production.
- **Site DOM Integrity & Accessibility**: Semantic landmarks (`<header role="banner">`, `<main>`, `<footer>`), heading hierarchy, and focus indicators.
- **Asset Loading & Network Resilience**: High-priority above-the-fold assets, lazy loading for below-the-fold milestones, zero dead external CDN dependencies.

---

## 4. Feature Traceability Matrix

| Feature # | Feature Name | Target Milestone | Test Suite | Test Count |
|:---:|---|:---:|---|:---:|
| 1 | React + Vite Migration | M1 | `tier1_features.test.js` | 6 |
| 2 | Authentic Asset Pipeline | M1 | `tier1_features.test.js`, `tier2_boundary.test.js` | 8 |
| 3 | AI Image Purge | M1 | `tier2_boundary.test.js` | 6 |
| 4 | Motorsport Design System | M1 | `tier3_combinations.test.js` | 4 |
| 5 | 3D Helmet Default State | M2 | `tier1_features.test.js` | 6 |
| 6 | 3D Helmet Hover Reveal | M2 | `tier1_features.test.js`, `tier2_boundary.test.js` | 10 |
| 7 | 3D Helmet Leave Restore | M2 | `tier1_features.test.js` | 6 |
| 8 | WebGL Feature Detection | M2 | `tier1_features.test.js`, `tier2_boundary.test.js` | 6 |
| 9 | 2.5D Helmet Fallback Card | M2 | `tier1_features.test.js`, `tier3_combinations.test.js` | 8 |
| 10 | 7-Milestone Career Data | M3 | `tier1_features.test.js`, `tier4_realworld.test.js` | 10 |
| 11 | Alternating Timeline Layout | M3 | `tier1_features.test.js` | 6 |
| 12 | Track Spine & Node Glow | M3 | `tier1_features.test.js`, `tier3_combinations.test.js` | 6 |
| 13 | Mobile Responsive Collapse | M3 | `tier1_features.test.js`, `tier2_boundary.test.js` | 7 |
| 14 | Responsive Navbar | M4 | `tier1_features.test.js`, `tier3_combinations.test.js` | 5 |
| 15 | Hero Section Layout | M4 | `tier1_features.test.js`, `tier4_realworld.test.js` | 5 |
| 16 | Driver Telemetry & Stats Grid | M4 | `tier1_features.test.js` | 4 |
| 17 | Motorsport Footer | M4 | `tier4_realworld.test.js` | 2 |
| 18 | Smooth Scrolling (Lenis) | M4 | `tier3_combinations.test.js` | 2 |
| 19 | Reduced Motion Support | M4 | `tier2_boundary.test.js` | 4 |
| 20 | E2E Test Suite (Tiers 1-4) | M-TEST | `runner.js` | - |
| **Total** | | | **All 4 Tiers** | **>=100 tests** |

---

## 5. Authoritative Expected Output Sources

All test assertions derive expected outputs strictly from authoritative sources:
1. **Reference Photos Ground Truth**:
   - Source directory: `C:/Users/PC/.gemini/antigravity/brain/c09273cb-e6bd-453b-9f8f-51c2d663e391/.user_uploaded/`
   - Verified binary dimensions, color types, and byte sizes mined by Explorer 2.
2. **Career Timeline Ground Truth**:
   - Verified race results, championships, teams, and car specs from ACI Sport, WSK Promotion, CIK-FIA, and Mercedes-AMG F1 team announcements mined by Explorer 3.
3. **3D Helmet State Machine Mathematical Specification**:
   - `revealFactor`: bounded in `[0.0, 1.0]`
   - `shellOpacity = lerp(1.0, 0.08, revealFactor)`
   - `faceOpacity = lerp(0.0, 1.0, revealFactor)`
   - Frame transition rate: `revealFactor += (target - revealFactor) * 0.08`
4. **Layout Breakpoint Specification**:
   - Mobile: `viewport <= 767px`
   - Desktop: `viewport >= 768px`

---

## 6. Failure Diagnosis & Troubleshooting Guide

| Failure Pattern | Root Cause | Remediation |
|---|---|---|
| `Zero AI regex audit failed` | Base64 string or synthetic AI image detected in source | Remove base64 image strings; import authentic assets from `src/assets/images/` |
| `Milestone count mismatch` | `CAREER_MILESTONES` does not contain exactly 7 items | Ensure all 7 epochs (2014-2018 to 2026) are defined in `src/data/careerTimeline.js` |
| `revealFactor out of bounds` | Lerp equation lacks Math.min/Math.max clamping | Clamp revealFactor with `Math.max(0.0, Math.min(1.0, value))` |
| `Missing authentic photo` | Target asset missing from `src/assets/images/` | Run copy script to sync all 12 photos from `.user_uploaded/` |
| `Mobile layout threshold inverted` | Breakpoint media query using `min-width: 768px` incorrectly | Ensure `@media (max-width: 767px)` applies single-column rail |
