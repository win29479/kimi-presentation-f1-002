# Project: Kimi Antonelli Immersive 3D F1 Driver Experience

## Architecture
- **Framework**: React 18 / Vite (Single-Page Application).
- **Styling**: Modular CSS + CSS Custom Properties Design System (`src/styles/tokens.css`, `src/styles/index.css`).
- **3D Graphics**: Three.js encapsulated in a dedicated React Canvas component (`Helmet3D.jsx`) with deterministic 60fps render loop and lerp transitions.
- **Fallback Layer**: `HelmetFallback.jsx` driven by `useWebGLSupport.js` for non-WebGL devices.
- **Scroll & Motion**: Lenis smooth scroll provider + CSS IntersectionObserver with `prefers-reduced-motion` suppression.
- **Asset Pipeline**: Centralized ES Module catalog (`src/assets/images/index.js`) serving the 12 authentic user-uploaded photographs. Zero AI images.
- **Testing**: Dual-track opaque-box E2E testing runner and validation harness.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | React + Vite Migration | Scaffold modern React + Vite project structure with clean build tooling | M1 | ORIGINAL_REQUEST §1 |
| 2 | Authentic Asset Pipeline | Copy and catalog 12 authentic reference photos into `src/assets/images/` | M1 | ORIGINAL_REQUEST §5 |
| 3 | AI Image Purge | Complete elimination of legacy base64 AI assets from codebase | M1 | ORIGINAL_REQUEST §5 |
| 4 | Motorsport Design System | CSS variables, carbon dark palette, Mercedes Petronas cyan accents, typography | M1 | ORIGINAL_REQUEST §6 |
| 5 | 3D Helmet Default State | Realistic 3D helmet with closed reflective visor and Mercedes livery | M2 | ORIGINAL_REQUEST §2 |
| 6 | 3D Helmet Hover Reveal | Smooth transition on hover/touch dissolving shell to reveal Kimi's face inside | M2 | ORIGINAL_REQUEST §2 |
| 7 | 3D Helmet Leave Restore | Smooth reverse transition on mouse/touch leave restoring closed helmet | M2 | ORIGINAL_REQUEST §2 |
| 8 | WebGL Feature Detection | `useWebGLSupport` hook detecting WebGL availability and context loss | M2 | ORIGINAL_REQUEST §7 |
| 9 | 2.5D Helmet Fallback Card | Interactive non-WebGL card cross-fading cockpit photo to Kimi portrait | M2 | ORIGINAL_REQUEST §7 |
| 10 | 7-Milestone Career Data | Verified career dataset from 2014 karting to 2026 title horizon in JS/TS | M3 | ORIGINAL_REQUEST §3 |
| 11 | Alternating Timeline Layout | Central glowing track with odd milestones left and even milestones right | M3 | ORIGINAL_REQUEST §4 |
| 12 | Track Spine & Node Glow | Scroll-driven glowing cyan line with illuminating milestone nodes | M3 | ORIGINAL_REQUEST §4 |
| 13 | Mobile Responsive Collapse | Unilateral single-column collapse for viewports <768px with left-anchored spine | M3 | ORIGINAL_REQUEST §4 & §7 |
| 14 | Responsive Navbar | Glassmorphic header with navigation links, driver badge #12, mobile drawer | M4 | ORIGINAL_REQUEST §1 |
| 15 | Hero Section Layout | Editorial headline, driver callsign, telemetry pills, and 3D canvas wrap | M4 | ORIGINAL_REQUEST §1 & §6 |
| 16 | Driver Telemetry & Stats Grid | High-impact telemetry cards with wins, podiums, win rates, and journey diptych | M4 | ORIGINAL_REQUEST §1 & §3 |
| 17 | Motorsport Footer | Team credentials, trademark #12 badge, and smooth back-to-top trigger | M4 | ORIGINAL_REQUEST §1 |
| 18 | Smooth Scrolling (Lenis) | Inertial smooth scrolling integrated across page sections | M4 | ORIGINAL_REQUEST §6 |
| 19 | Reduced Motion Support | Complete suppression of rotational drift and slide animations when requested | M4 | ORIGINAL_REQUEST §7 |
| 20 | E2E Test Suite (Tiers 1-4) | Comprehensive opaque-box test suite verifying all features, boundaries, combinations | M-TEST | Project Dual Track |
| 21 | Production Build Verification | Zero-error `vite build` production output validation | M5 | FINAL ACCEPTANCE #8 |
| 22 | Git Push & Commit | Stage, commit, and push all revamped code to GitHub repository | M6 | ORIGINAL_REQUEST §8 |
| 23 | Vercel Deployment | Deploy project to Vercel production with verified live URL | M6 | ORIGINAL_REQUEST §8 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Project Scaffolding & Asset Pipeline | React + Vite setup, dependencies, copy 12 authentic photos, ES Module asset catalog, CSS tokens | none | DONE |
| M2 | Interactive 3D Helmet Experience | `Helmet3D.jsx` Three.js canvas, hover reveal, visor tint, `useWebGLSupport`, `HelmetFallback.jsx` | M1 | IN_PROGRESS |
| M3 | Career Timeline & Alternating Layout | `careerTimeline.js` 7 verified milestones, `CareerTimeline.jsx`, `TimelineItem.jsx`, glowing spine, responsive collapse | M1 | IN_PROGRESS |
| M4 | Core UI Integration & Telemetry | `Navbar.jsx`, `HeroSection.jsx`, `DriverStats.jsx`, `Footer.jsx`, `App.jsx`, Lenis scroll, a11y | M2, M3 | PLANNED |
| M-TEST | E2E Testing Track | Independent opaque-box test harness, runner, Tier 1-4 test cases, `TEST_READY.md` | none (Parallel) | IN_PROGRESS |
| M5 | Final Verification & Integration Gate | Pass 100% of E2E tests, production build verification, responsive & integrity gate | M4, M-TEST | PLANNED |
| M6 | Git Commit, Push & Vercel Deployment | Git commit, push to GitHub `main`, Vercel deployment with team access & live URL verification | M5 | PLANNED |

## Interface Contracts

### M1 ↔ M2 / M3 / M4 (Asset Catalog)
- **Module**: `src/assets/images/index.js`
- **Export**: `KIMI_IMAGES` object containing 12 authentic image items:
  - `heroCollar`, `champion2026`, `kartingRosberg`, `journeySideBySide`, `kartingEarly`, `f4Champion2022`, `frecaPrema2023`, `frmecFalcone`, `cockpitHelmet`, `portraitOfficial`, `paddockIntense`, `f2Smiling2024`.
  - Shape: `{ src: string, alt: string, width: number, height: number, hasAlpha: boolean }`.

### M2 (Helmet3D Component)
- **Component**: `src/components/Helmet3D.jsx`
- **Props**: `{ fallback?: ReactNode, className?: string }`
- **State Machine**:
  - `isHovered: boolean` (pointerenter / pointerleave / touch)
  - `revealFactor: number` (0.0 to 1.0 lerped at 60fps)
  - Shell & Visor Opacity: `lerp(1.0, 0.08, revealFactor)`
  - Inner Face Opacity / Intensity: `lerp(0.0, 1.0, revealFactor)`
- **Fallback Trigger**: If WebGL context creation throws, renders `<HelmetFallback />`.

### M3 (Career Timeline Data Contract)
- **Module**: `src/data/careerTimeline.js`
- **Export**: `CAREER_MILESTONES: MilestoneItem[]`
- **Shape**:
  ```typescript
  interface MilestoneItem {
    id: string;
    year: string;
    age: string;
    title: string;
    subtitle: string;
    category: string;
    team: string;
    car: string;
    achievements: string[];
    description: string;
    photoKey: string;
    accentColor: string;
    tag: string;
  }
  ```

### M3 (Timeline Components)
- **Component**: `src/components/CareerTimeline.jsx` (Wrapper with central vertical spine)
- **Component**: `src/components/TimelineItem.jsx`
  - Props: `{ item: MilestoneItem, index: number }`
  - Layout: `index % 2 === 0 ? "timeline-left" : "timeline-right"`
  - Mobile: `@media (max-width: 767px)` single column with left rail.

## Code Layout
```
c:\Users\PC\Desktop\testkit\kimi antoneli 3d website/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── images/
│   │       ├── index.js
│   │       └── kimi-*.png / jpg (12 authentic photos)
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── HeroSection.jsx
│   │   ├── Helmet3D.jsx
│   │   ├── HelmetFallback.jsx
│   │   ├── CareerTimeline.jsx
│   │   ├── TimelineItem.jsx
│   │   ├── DriverStats.jsx
│   │   └── Footer.jsx
│   ├── data/
│   │   ├── careerTimeline.js
│   │   └── driverTelemetry.js
│   ├── hooks/
│   │   ├── useLenis.js
│   │   └── useWebGLSupport.js
│   ├── styles/
│   │   ├── tokens.css
│   │   └── index.css
│   ├── App.jsx
│   └── main.jsx
├── tests/
│   ├── e2e/
│   └── runner.js
├── index.html
├── package.json
├── vite.config.js
├── PROJECT.md
└── TEST_INFRA.md
```
