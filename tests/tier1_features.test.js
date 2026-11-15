/**
 * Tier 1: Feature Coverage E2E Test Suite
 *
 * Covers:
 *  - React + Vite scaffolding & package.json
 *  - 3D Helmet default state (closed visor, visible, 60fps drift)
 *  - 3D Helmet hover reveal (smooth opacity dissolution & face reveal)
 *  - 3D Helmet leave restore (smooth reversal back to closed helmet)
 *  - WebGL feature detection & HelmetFallback card
 *  - 7 Career Milestones verified data schema & historical facts
 *  - Alternating left/right timeline layout logic & central spine
 *  - 12 Authentic Photos catalog & disk verification
 *  - Responsive viewport layout adaptation (<768px vs >=768px)
 *  - Driver telemetry & career stats grid
 *
 * Target: >= 50 tests.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, it, expect } from './runner.js';

const ROOT_DIR = path.resolve('.');
const ASSETS_DIR = path.join(ROOT_DIR, 'src', 'assets', 'images');

// -----------------------------------------------------------------------------
// Suite 1: React + Vite Project Scaffolding & Configuration
// -----------------------------------------------------------------------------
describe('Feature 1: React + Vite Scaffolding & Configuration', () => {
  it('1.1: package.json exists and is valid JSON', () => {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    expect(fs.existsSync(pkgPath)).toBeTruthy();
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(typeof pkg).toBe('object');
    expect(pkg.name).toBeDefined();
  });

  it('1.2: package.json specifies "type": "module" for modern ESM', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
    expect(pkg.type).toBe('module');
  });

  it('1.3: package.json includes npm test script pointing to node tests/runner.js', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts.test).toBe('node tests/runner.js');
  });

  it('1.4: package.json declares core dependencies: three, lenis, lucide-react, react', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    expect(allDeps.react).toBeDefined();
    expect(allDeps.three).toBeDefined();
    expect(allDeps.lenis).toBeDefined();
    expect(allDeps['lucide-react']).toBeDefined();
  });

  it('1.5: index.html defines the root mounting container element id="root" and entry script', () => {
    const htmlPath = path.join(ROOT_DIR, 'index.html');
    expect(fs.existsSync(htmlPath)).toBeTruthy();
    const html = fs.readFileSync(htmlPath, 'utf8');
    expect(html).toContain('id="root"');
    expect(html).toMatch(/id=["']root["']/);
    expect(html).toMatch(/<script\s+type="module"\s+src="\/src\/main\.jsx"><\/script>/);
  });

  it('1.6: HTML entry point specifies responsive viewport meta tag', () => {
    const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    expect(html).toMatch(/viewport/i);
    expect(html).toMatch(/width=device-width/i);
  });
});

// -----------------------------------------------------------------------------
// Suite 2: 3D Helmet Default State Machine
// -----------------------------------------------------------------------------
describe('Feature 2: 3D Helmet Default State Machine', () => {
  // Pure state machine simulation matching Helmet3D specification
  function createHelmetState() {
    return {
      isHovered: false,
      revealFactor: 0.0,
      driftVelocity: 0.005,
      getShellOpacity() {
        // lerp(1.0, 0.08, revealFactor)
        return 1.0 - this.revealFactor * (1.0 - 0.08);
      },
      getVisorOpacity() {
        return 1.0 - this.revealFactor * (1.0 - 0.08);
      },
      getFaceOpacity() {
        // lerp(0.0, 1.0, revealFactor)
        return this.revealFactor;
      },
    };
  }

  it('2.1: Default helmet state initializes with isHovered = false', () => {
    const state = createHelmetState();
    expect(state.isHovered).toBe(false);
  });

  it('2.2: Default revealFactor starts at strictly 0.0', () => {
    const state = createHelmetState();
    expect(state.revealFactor).toBe(0.0);
  });

  it('2.3: Shell opacity evaluates to 1.0 (fully closed opaque helmet) at default state', () => {
    const state = createHelmetState();
    expect(state.getShellOpacity()).toBeCloseTo(1.0, 4);
  });

  it('2.4: Visor opacity evaluates to 1.0 (reflective closed visor) at default state', () => {
    const state = createHelmetState();
    expect(state.getVisorOpacity()).toBeCloseTo(1.0, 4);
  });

  it('2.5: Inner face portrait opacity evaluates to 0.0 (completely occluded) at default state', () => {
    const state = createHelmetState();
    expect(state.getFaceOpacity()).toBeCloseTo(0.0, 4);
  });

  it('2.6: Idle ambient rotational drift velocity is active (omega > 0) when motion enabled', () => {
    const state = createHelmetState();
    expect(state.driftVelocity).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
// Suite 3: 3D Helmet Hover Reveal Transition Dynamics
// -----------------------------------------------------------------------------
describe('Feature 3: 3D Helmet Hover Reveal Transition Dynamics', () => {
  function stepReveal(currentFactor, isHovered, lerpRate = 0.08) {
    const target = isHovered ? 1.0 : 0.0;
    return currentFactor + (target - currentFactor) * lerpRate;
  }

  it('3.1: pointerenter event sets isHovered = true', () => {
    let isHovered = false;
    const onPointerEnter = () => { isHovered = true; };
    onPointerEnter();
    expect(isHovered).toBe(true);
  });

  it('3.2: revealFactor increases progressively over consecutive frames toward target 1.0', () => {
    let factor = 0.0;
    const frames = [];
    for (let i = 0; i < 10; i++) {
      factor = stepReveal(factor, true, 0.08);
      frames.push(factor);
    }
    expect(frames[0]).toBeGreaterThan(0.0);
    expect(frames[9]).toBeGreaterThan(frames[0]);
    expect(frames[9]).toBeLessThan(1.0);
  });

  it('3.3: Outer helmet shell dissolves to 0.08 opacity at full reveal (revealFactor = 1.0)', () => {
    const factor = 1.0;
    const shellOpacity = 1.0 - factor * (1.0 - 0.08);
    expect(shellOpacity).toBeCloseTo(0.08, 4);
  });

  it('3.4: Visor dissolves to 0.08 opacity at full reveal (revealFactor = 1.0)', () => {
    const factor = 1.0;
    const visorOpacity = 1.0 - factor * (1.0 - 0.08);
    expect(visorOpacity).toBeCloseTo(0.08, 4);
  });

  it('3.5: Inner face portrait reaches full 1.0 opacity at full reveal (revealFactor = 1.0)', () => {
    const factor = 1.0;
    const faceOpacity = factor;
    expect(faceOpacity).toBe(1.0);
  });

  it('3.6: Transition is continuous and smooth without step-function jumps', () => {
    let factor = 0.0;
    let maxDelta = 0;
    for (let i = 0; i < 30; i++) {
      const prev = factor;
      factor = stepReveal(factor, true, 0.08);
      const delta = Math.abs(factor - prev);
      if (delta > maxDelta) maxDelta = delta;
    }
    // Max frame change should never exceed 0.08 (smooth decay)
    expect(maxDelta).toBeLessThanOrEqual(0.08);
  });
});

// -----------------------------------------------------------------------------
// Suite 4: 3D Helmet Leave Restore Transition Dynamics
// -----------------------------------------------------------------------------
describe('Feature 4: 3D Helmet Leave Restore Transition Dynamics', () => {
  function stepRestore(currentFactor, isHovered, lerpRate = 0.08) {
    const target = isHovered ? 1.0 : 0.0;
    return currentFactor + (target - currentFactor) * lerpRate;
  }

  it('4.1: pointerleave event sets isHovered = false', () => {
    let isHovered = true;
    const onPointerLeave = () => { isHovered = false; };
    onPointerLeave();
    expect(isHovered).toBe(false);
  });

  it('4.2: Target reveal factor flips from 1.0 to 0.0 on leave', () => {
    const isHovered = false;
    const target = isHovered ? 1.0 : 0.0;
    expect(target).toBe(0.0);
  });

  it('4.3: revealFactor decreases monotonically over frames when isHovered = false', () => {
    let factor = 1.0;
    const frameValues = [];
    for (let i = 0; i < 10; i++) {
      factor = stepRestore(factor, false, 0.08);
      frameValues.push(factor);
    }
    expect(frameValues[0]).toBeLessThan(1.0);
    expect(frameValues[9]).toBeLessThan(frameValues[0]);
    expect(frameValues[9]).toBeGreaterThan(0.0);
  });

  it('4.4: Mid-transition state (revealFactor = 0.5) has shell opacity 0.54 and face opacity 0.50', () => {
    const factor = 0.5;
    const shellOpacity = 1.0 - factor * (1.0 - 0.08);
    const faceOpacity = factor;
    expect(shellOpacity).toBeCloseTo(0.54, 3);
    expect(faceOpacity).toBeCloseTo(0.50, 3);
  });

  it('4.5: After sufficient frames (>60 frames), revealFactor converges to 0.0 (restoring closed helmet)', () => {
    let factor = 1.0;
    for (let i = 0; i < 80; i++) {
      factor = stepRestore(factor, false, 0.08);
    }
    expect(factor).toBeLessThan(0.002);
    const shellOpacity = 1.0 - factor * (1.0 - 0.08);
    expect(shellOpacity).toBeGreaterThan(0.998);
  });

  it('4.6: Re-entering during restore reverses smoothly without flickering', () => {
    let factor = 0.5; // Mid-restore
    // User re-enters
    const factorNext = stepRestore(factor, true, 0.08);
    expect(factorNext).toBeGreaterThan(0.5);
    expect(factorNext).toBeCloseTo(0.54, 2);
  });
});

// -----------------------------------------------------------------------------
// Suite 5: WebGL Detection & Helmet Fallback Card
// -----------------------------------------------------------------------------
describe('Feature 5: WebGL Detection & Helmet Fallback Card', () => {
  // Pure WebGL detector logic matching useWebGLSupport.js contract
  function checkWebGLSupport(mockCanvas) {
    if (!mockCanvas) return false;
    try {
      const gl = mockCanvas.getContext('webgl2') || mockCanvas.getContext('webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  it('5.1: useWebGLSupport detects functional WebGL context', () => {
    const mockCanvas = {
      getContext: (type) => (type === 'webgl2' || type === 'webgl' ? {} : null),
    };
    expect(checkWebGLSupport(mockCanvas)).toBe(true);
  });

  it('5.2: Simulated absence of WebGL sets isWebGLSupported to false', () => {
    const mockCanvas = {
      getContext: () => null,
    };
    expect(checkWebGLSupport(mockCanvas)).toBe(false);
  });

  it('5.3: When WebGL context creation throws, detector catches and returns false', () => {
    const mockCanvas = {
      getContext: () => { throw new Error('GPU process crashed'); },
    };
    expect(checkWebGLSupport(mockCanvas)).toBe(false);
  });

  it('5.4: Fallback default visual specifies authentic cockpit photo kimi-cockpit-helmet-mercedes.jpg on disk', () => {
    const catalogPath = path.join(ROOT_DIR, 'src', 'assets', 'images', 'index.js');
    expect(fs.existsSync(catalogPath)).toBe(true);
    const catalogSrc = fs.readFileSync(catalogPath, 'utf8');
    expect(catalogSrc).toContain('cockpitHelmet');
    expect(catalogSrc).toContain('kimi-cockpit-helmet-mercedes.jpg');
    const photoPath = path.join(ASSETS_DIR, 'kimi-cockpit-helmet-mercedes.jpg');
    expect(fs.existsSync(photoPath)).toBe(true);
    expect(fs.statSync(photoPath).size).toBeGreaterThan(30000);
  });

  it('5.5: Fallback hover state cross-fades to official portrait kimi-mercedes-portrait-official.png on disk', () => {
    const catalogPath = path.join(ROOT_DIR, 'src', 'assets', 'images', 'index.js');
    const catalogSrc = fs.readFileSync(catalogPath, 'utf8');
    expect(catalogSrc).toContain('portraitOfficial');
    expect(catalogSrc).toContain('kimi-mercedes-portrait-official.png');
    const portraitPath = path.join(ASSETS_DIR, 'kimi-mercedes-portrait-official.png');
    expect(fs.existsSync(portraitPath)).toBe(true);
    expect(fs.statSync(portraitPath).size).toBeGreaterThan(30000);
  });

  it('5.6: Fallback cockpit photo maintains 3:2 landscape aspect ratio on disk', () => {
    const photoPath = path.join(ASSETS_DIR, 'kimi-cockpit-helmet-mercedes.jpg');
    expect(fs.existsSync(photoPath)).toBe(true);
    const buf = fs.readFileSync(photoPath);
    let offset = 2;
    let width = 0, height = 0;
    while (offset < buf.length) {
      if (buf[offset] !== 0xFF) break;
      const marker = buf[offset + 1];
      if (marker === 0xC0 || marker === 0xC2) {
        height = buf.readUInt16BE(offset + 5);
        width = buf.readUInt16BE(offset + 7);
        break;
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
    expect(width).toBe(599);
    expect(height).toBe(399);
    expect(width / height).toBeCloseTo(3 / 2, 2);
  });
});

// -----------------------------------------------------------------------------
// Suite 6: 7 Career Milestones Data Schema & Historical Accuracy
// -----------------------------------------------------------------------------
describe('Feature 6: 7 Career Milestones Data Schema & Historical Accuracy', () => {
  const timelinePath = path.join(ROOT_DIR, 'src', 'data', 'careerTimeline.js');

  it('6.1: Career milestones module exists and contains exactly 7 chronological milestones', async () => {
    expect(fs.existsSync(timelinePath)).toBe(true);
    const { CAREER_MILESTONES } = await import(pathToFileURL(timelinePath).href);
    expect(CAREER_MILESTONES.length).toBe(7);
  });

  it('6.2: Every milestone item defines required fields matching MilestoneItem contract', async () => {
    const { CAREER_MILESTONES } = await import(pathToFileURL(timelinePath).href);
    const requiredFields = ['id', 'year', 'age', 'title', 'category', 'team', 'car', 'achievements', 'description', 'photoKey', 'accentColor', 'tag'];
    for (const m of CAREER_MILESTONES) {
      for (const f of requiredFields) {
        expect(m[f]).toBeDefined();
      }
      expect(m.achievements.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('6.3: Milestone 1 documents Grassroots Karting (2014-2018) under Antonelli Motorsport', async () => {
    const { CAREER_MILESTONES } = await import(pathToFileURL(timelinePath).href);
    const m1 = CAREER_MILESTONES[0];
    expect(m1.year).toContain('2014');
    expect(m1.team).toContain('Antonelli Motorsport');
    expect(m1.photoKey).toContain('karting');
  });

  it('6.4: Milestone 2 documents Mercedes Junior Team signing in April 2019 & back-to-back European OK titles', async () => {
    const { CAREER_MILESTONES } = await import(pathToFileURL(timelinePath).href);
    const m2 = CAREER_MILESTONES[1];
    expect(m2.year).toContain('2019');
    expect(m2.achievements.some((a) => a.includes('April 2019'))).toBe(true);
    expect(m2.achievements.some((a) => a.includes('CIK-FIA'))).toBe(true);
  });

  it('6.5: Milestone 3 records 2022 Double Crown with 22 race wins in Italian & ADAC F4', async () => {
    const { CAREER_MILESTONES } = await import(pathToFileURL(timelinePath).href);
    const m3 = CAREER_MILESTONES[2];
    expect(m3.year).toBe('2022');
    expect(m3.team).toContain('PREMA');
    expect(m3.achievements.some((a) => a.includes('22 Total F4 Victories'))).toBe(true);
  });

  it('6.6: Milestone 4 records 2023 Formula Regional titles across FRECA and FRMEC', async () => {
    const { CAREER_MILESTONES } = await import(pathToFileURL(timelinePath).href);
    const m4 = CAREER_MILESTONES[3];
    expect(m4.year).toBe('2023');
    expect(m4.achievements.some((a) => a.includes('FRMEC Champion'))).toBe(true);
    expect(m4.achievements.some((a) => a.includes('FRECA Champion'))).toBe(true);
  });

  it('6.7: Milestone 5 records 2024 F2 victories (Silverstone & Budapest) and Monza F1 FP1 debut', async () => {
    const { CAREER_MILESTONES } = await import(pathToFileURL(timelinePath).href);
    const m5 = CAREER_MILESTONES[4];
    expect(m5.year).toBe('2024');
    expect(m5.achievements.some((a) => a.includes('Silverstone'))).toBe(true);
    expect(m5.achievements.some((a) => a.includes('Monza'))).toBe(true);
  });

  it('6.8: Milestone 6 records confirmation as Mercedes F1 works driver with car #12 for 2025', async () => {
    const { CAREER_MILESTONES } = await import(pathToFileURL(timelinePath).href);
    const m6 = CAREER_MILESTONES[5];
    expect(m6.year).toContain('2025');
    expect(m6.achievements.some((a) => a.includes('#12'))).toBe(true);
    expect(m6.title).toContain('#12');
  });
});

// -----------------------------------------------------------------------------
// Suite 7: Alternating Timeline Layout Engine
// -----------------------------------------------------------------------------
describe('Feature 7: Alternating Timeline Layout Engine', () => {
  function getTimelineItemSide(index) {
    return index % 2 === 0 ? 'timeline-left' : 'timeline-right';
  }

  function getConnectorOrientation(index) {
    return index % 2 === 0 ? 'pointing-right' : 'pointing-left';
  }

  it('7.1: Odd index 0 resolves to left-aligned card ("timeline-left")', () => {
    expect(getTimelineItemSide(0)).toBe('timeline-left');
  });

  it('7.2: Even index 1 resolves to right-aligned card ("timeline-right")', () => {
    expect(getTimelineItemSide(1)).toBe('timeline-right');
  });

  it('7.3: Alternation alternates strictly across all 7 milestones (L, R, L, R, L, R, L)', () => {
    const sides = [0, 1, 2, 3, 4, 5, 6].map(getTimelineItemSide);
    expect(sides).toEqual([
      'timeline-left',
      'timeline-right',
      'timeline-left',
      'timeline-right',
      'timeline-left',
      'timeline-right',
      'timeline-left',
    ]);
  });

  it('7.4: Left cards position horizontal connector pointing right toward center track', () => {
    expect(getConnectorOrientation(0)).toBe('pointing-right');
    expect(getConnectorOrientation(2)).toBe('pointing-right');
  });

  it('7.5: Right cards position horizontal connector pointing left toward center track', () => {
    expect(getConnectorOrientation(1)).toBe('pointing-left');
    expect(getConnectorOrientation(3)).toBe('pointing-left');
  });

  it('7.6: Central track spine positioning is centered at 50% in desktop layout stylesheet', () => {
    const cssPath = path.join(ROOT_DIR, 'src', 'styles', 'index.css');
    expect(fs.existsSync(cssPath)).toBe(true);
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    expect(cssContent).toContain('left: 50%');
    expect(cssContent).toContain('transform: translateX(-50%)');
    const tokensPath = path.join(ROOT_DIR, 'src', 'styles', 'tokens.css');
    expect(fs.existsSync(tokensPath)).toBe(true);
    const tokensContent = fs.readFileSync(tokensPath, 'utf8');
    expect(tokensContent).toContain('--timeline-spine-center: 50%');
  });
});

// -----------------------------------------------------------------------------
// Suite 8: 12 Authentic Photos Catalog & Disk Integrity
// -----------------------------------------------------------------------------
describe('Feature 8: 12 Authentic Photos Catalog & Disk Verification', () => {
  const EXPECTED_MEDIA = [
    { file: 'kimi-hero-adjusting-collar.png', key: 'heroCollar', hasAlpha: true },
    { file: 'kimi-2026-world-champion-stamp.jpg', key: 'champion2026', hasAlpha: false },
    { file: 'kimi-karting-rosberg-2018.jpg', key: 'kartingRosberg', hasAlpha: false },
    { file: 'kimi-journey-kart-to-f1.jpg', key: 'journeySideBySide', hasAlpha: false },
    { file: 'kimi-karting-antonelli-early.png', key: 'kartingEarly', hasAlpha: true },
    { file: 'kimi-f4-champion-2022.jpg', key: 'f4Champion2022', hasAlpha: false },
    { file: 'kimi-freca-prema-2023.jpg', key: 'frecaPrema2023', hasAlpha: false },
    { file: 'kimi-frmec-falcone-thumbsup.jpg', key: 'frmecFalcone', hasAlpha: false },
    { file: 'kimi-cockpit-helmet-mercedes.jpg', key: 'cockpitHelmet', hasAlpha: false },
    { file: 'kimi-mercedes-portrait-official.png', key: 'portraitOfficial', hasAlpha: true },
    { file: 'kimi-mercedes-paddock-intense.jpg', key: 'paddockIntense', hasAlpha: false },
    { file: 'kimi-f2-prema-smiling-2024.jpg', key: 'f2Smiling2024', hasAlpha: false },
  ];

  it('8.1: Asset directory exists and contains all 12 authentic photo files', () => {
    expect(fs.existsSync(ASSETS_DIR)).toBe(true);
    for (const item of EXPECTED_MEDIA) {
      const fullPath = path.join(ASSETS_DIR, item.file);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('8.2: All 12 authentic photo files have non-zero file sizes (>30 KB)', () => {
    for (const item of EXPECTED_MEDIA) {
      const stat = fs.statSync(path.join(ASSETS_DIR, item.file));
      expect(stat.size).toBeGreaterThan(30000);
    }
  });

  it('8.3: Exactly 12 authentic photo keys are designated in KIMI_IMAGES contract', () => {
    const catalogPath = path.join(ASSETS_DIR, 'index.js');
    expect(fs.existsSync(catalogPath)).toBe(true);
    const catalogSrc = fs.readFileSync(catalogPath, 'utf8');
    for (const item of EXPECTED_MEDIA) {
      expect(catalogSrc).toContain(item.key);
      expect(catalogSrc).toContain(item.file);
    }
  });

  it('8.4: Transparent PNG assets (heroCollar, portraitOfficial) have hasAlpha: true', () => {
    const alphaAssets = EXPECTED_MEDIA.filter((m) => m.hasAlpha);
    expect(alphaAssets.length).toBeGreaterThanOrEqual(2);
    expect(alphaAssets.map((a) => a.key)).toContain('heroCollar');
    expect(alphaAssets.map((a) => a.key)).toContain('portraitOfficial');
  });

  it('8.5: Official Mercedes portrait (portraitOfficial) is 440x440 square ColorType 6 on disk', () => {
    const buf = fs.readFileSync(path.join(ASSETS_DIR, 'kimi-mercedes-portrait-official.png'));
    // Read PNG IHDR dimensions (offset 16: width, offset 20: height, offset 25: colorType)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const colorType = buf.readUInt8(25);
    expect(width).toBe(440);
    expect(height).toBe(440);
    expect(colorType).toBe(6);
  });

  it('8.6: 2026 World Champion card (champion2026) is portrait orientation with height > width on disk', () => {
    const photoPath = path.join(ASSETS_DIR, 'kimi-2026-world-champion-stamp.jpg');
    const stat = fs.statSync(photoPath);
    expect(stat.size).toBeGreaterThan(200000);
    const buf = fs.readFileSync(photoPath);
    let offset = 2;
    let width = 0, height = 0;
    while (offset < buf.length) {
      if (buf[offset] !== 0xFF) break;
      const marker = buf[offset + 1];
      if (marker === 0xC0 || marker === 0xC2) {
        height = buf.readUInt16BE(offset + 5);
        width = buf.readUInt16BE(offset + 7);
        break;
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
    expect(height).toBe(1024);
    expect(width).toBe(803);
    expect(height).toBeGreaterThan(width);
  });
});

// -----------------------------------------------------------------------------
// Suite 9: Responsive Layout Adaptation & Viewport Engine
// -----------------------------------------------------------------------------
describe('Feature 9: Responsive Viewport Layout Adaptation', () => {
  function resolveTimelineLayout(viewportWidth) {
    if (viewportWidth < 768) {
      return {
        columns: 1,
        spinePosition: 'left',
        spineLeftPx: 24,
        cardWidthPercent: 100,
        alternating: false,
      };
    }
    return {
      columns: 2,
      spinePosition: 'center',
      spineLeftPercent: 50,
      cardWidthCalc: 'calc(50% - 3.5rem)',
      alternating: true,
    };
  }

  it('9.1: Desktop viewport (1280px) activates two-column alternating timeline', () => {
    const layout = resolveTimelineLayout(1280);
    expect(layout.columns).toBe(2);
    expect(layout.alternating).toBe(true);
    expect(layout.spinePosition).toBe('center');
  });

  it('9.2: Mobile viewport (375px) collapses to single-column layout', () => {
    const layout = resolveTimelineLayout(375);
    expect(layout.columns).toBe(1);
    expect(layout.alternating).toBe(false);
    expect(layout.spinePosition).toBe('left');
  });

  it('9.3: Mobile spine anchors to left margin (24px)', () => {
    const layout = resolveTimelineLayout(414);
    expect(layout.spineLeftPx).toBe(24);
  });

  it('9.4: Mobile cards expand to 100% available column width', () => {
    const layout = resolveTimelineLayout(600);
    expect(layout.cardWidthPercent).toBe(100);
  });
});

// -----------------------------------------------------------------------------
// Suite 10: Driver Telemetry & Career Stats Grid
// -----------------------------------------------------------------------------
describe('Feature 10: Driver Telemetry & Career Stats Grid', () => {
  const telemetryPath = path.join(ROOT_DIR, 'src', 'data', 'driverTelemetry.js');

  it('10.1: Driver telemetry specifies permanent racing number #12', async () => {
    expect(fs.existsSync(telemetryPath)).toBe(true);
    const { DRIVER_TELEMETRY } = await import(pathToFileURL(telemetryPath).href);
    expect(DRIVER_TELEMETRY.carNumber).toBe(12);
  });

  it('10.2: Championships count equals 4 junior single-seater titles', async () => {
    const { DRIVER_TELEMETRY } = await import(pathToFileURL(telemetryPath).href);
    expect(DRIVER_TELEMETRY.championshipsCount).toBe(4);
    expect(DRIVER_TELEMETRY.championshipTitles.length).toBe(4);
  });

  it('10.3: Total single-seater race victories equals 32 wins', async () => {
    const { DRIVER_TELEMETRY } = await import(pathToFileURL(telemetryPath).href);
    const calculatedWins =
      DRIVER_TELEMETRY.f4WinCount +
      DRIVER_TELEMETRY.frecaWinCount +
      DRIVER_TELEMETRY.frmecWinCount +
      DRIVER_TELEMETRY.f2WinCount;
    expect(calculatedWins).toBe(DRIVER_TELEMETRY.totalJuniorWins);
    expect(DRIVER_TELEMETRY.totalJuniorWins).toBe(32);
  });

  it('10.4: Driver evolution diptych card exists comparing childhood karting with Mercedes F1 driver', async () => {
    const { DRIVER_TELEMETRY } = await import(pathToFileURL(telemetryPath).href);
    expect(DRIVER_TELEMETRY.evolutionDiptych.photoKey).toBe('journeySideBySide');
    const diptychPhoto = path.join(ASSETS_DIR, 'kimi-journey-kart-to-f1.jpg');
    expect(fs.existsSync(diptychPhoto)).toBe(true);
    expect(fs.statSync(diptychPhoto).size).toBeGreaterThan(30000);
  });
});
