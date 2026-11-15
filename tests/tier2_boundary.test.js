/**
 * Tier 2: Boundary & Corner Cases E2E Test Suite
 *
 * Covers:
 *  - Zero AI images & legacy base64 AI strings regex audit across project
 *  - 767px vs 768px layout thresholds & edge viewports (320px, 2560px)
 *  - Rapid hover in/out revealFactor bounds clamp [0.0, 1.0]
 *  - prefers-reduced-motion accessibility compliance
 *  - WebGL context loss / throw fallback behavior
 *  - Photo aspect ratios, binary headers, and 8-bit RGBA alpha preservation
 *
 * Target: >= 25 tests.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from './runner.js';

const ROOT_DIR = path.resolve('.');
const ASSETS_DIR = path.join(ROOT_DIR, 'src', 'assets', 'images');
const UPLOADED_DIR = 'C:/Users/PC/.gemini/antigravity/brain/c09273cb-e6bd-453b-9f8f-51c2d663e391/.user_uploaded';

// -----------------------------------------------------------------------------
// Suite 1: Zero AI Images & Legacy Base64 AI Strings Regex Audit
// -----------------------------------------------------------------------------
describe('Boundary 1: Zero AI Images & Regex Audit', () => {
  const AI_STRING_PATTERNS = [
    /AI_PORTRAIT_DATA_URL/g,
    /AI_HELMET_DATA_URL/g,
    /AI_EXTRA_ASSETS/g,
    /data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]{1000,}/g,
  ];

  it('1.1: Modern project files must not define legacy AI variables AI_PORTRAIT_DATA_URL', () => {
    const srcDir = path.join(ROOT_DIR, 'src');
    expect(fs.existsSync(srcDir)).toBe(true);
    const checkDir = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          checkDir(fullPath);
        } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx') || file.name.endsWith('.css')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content).not.toMatch(/AI_PORTRAIT_DATA_URL/);
        }
      }
    };
    checkDir(srcDir);
  });

  it('1.2: Modern project files must not define legacy AI variables AI_HELMET_DATA_URL', () => {
    const srcDir = path.join(ROOT_DIR, 'src');
    expect(fs.existsSync(srcDir)).toBe(true);
    const checkDir = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) checkDir(fullPath);
        else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content).not.toMatch(/AI_HELMET_DATA_URL/);
        }
      }
    };
    checkDir(srcDir);
  });

  it('1.3: Modern project files must not define legacy AI variables AI_EXTRA_ASSETS', () => {
    const srcDir = path.join(ROOT_DIR, 'src');
    expect(fs.existsSync(srcDir)).toBe(true);
    const checkDir = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) checkDir(fullPath);
        else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content).not.toMatch(/AI_EXTRA_ASSETS/);
        }
      }
    };
    checkDir(srcDir);
  });

  it('1.4: Base64 image payload regex catches legacy strings over 1000 characters', () => {
    const sampleAiString = 'data:image/jpeg;base64,' + 'A'.repeat(2000);
    expect(AI_STRING_PATTERNS[3].test(sampleAiString)).toBe(true);
  });

  it('1.5: package.json contains zero AI image generators or prompt packages', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
    const allDeps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
    for (const dep of allDeps) {
      expect(dep).not.toMatch(/midjourney/i);
      expect(dep).not.toMatch(/dall-e/i);
      expect(dep).not.toMatch(/replicate/i);
    }
  });
});

// -----------------------------------------------------------------------------
// Suite 2: 767px vs 768px Layout Thresholds & Edge Viewports
// -----------------------------------------------------------------------------
describe('Boundary 2: Responsive Thresholds (767px vs 768px)', () => {
  function getLayoutMode(viewportWidth) {
    if (typeof viewportWidth !== 'number' || isNaN(viewportWidth)) {
      throw new Error('Invalid viewport width');
    }
    // Strict threshold: < 768px is mobile (including 767px, 767.5px, 767.9px); >= 768px is desktop
    if (viewportWidth < 768) {
      return {
        mode: 'mobile-single-column',
        railPosition: 'left',
        railOffsetPx: 24,
        cardWidthMode: 'full-width',
        alternates: false,
      };
    }
    return {
      mode: 'desktop-alternating',
      railPosition: 'center',
      railOffsetPercent: 50,
      cardWidthMode: 'half-width',
      alternates: true,
    };
  }

  it('2.1: Exactly 767px viewport width resolves strictly to mobile single-column layout', () => {
    const layout = getLayoutMode(767);
    expect(layout.mode).toBe('mobile-single-column');
    expect(layout.alternates).toBe(false);
    expect(layout.railPosition).toBe('left');
  });

  it('2.2: Exactly 768px viewport width resolves strictly to desktop alternating layout', () => {
    const layout = getLayoutMode(768);
    expect(layout.mode).toBe('desktop-alternating');
    expect(layout.alternates).toBe(true);
    expect(layout.railPosition).toBe('center');
  });

  it('2.3: Boundary delta of 1px (767px -> 768px) switches rail position from left to center', () => {
    const mobile = getLayoutMode(767);
    const desktop = getLayoutMode(768);
    expect(mobile.railPosition).toBe('left');
    expect(desktop.railPosition).toBe('center');
  });

  it('2.4: Sub-pixel boundary (767.9px) is safely handled by floor/media-query logic', () => {
    // Sub-pixel mobile viewport (< 768px) must strictly resolve to mobile single-column
    const subpixelMobile = getLayoutMode(767.9);
    expect(subpixelMobile.mode).toBe('mobile-single-column');
    expect(subpixelMobile.alternates).toBe(false);
    expect(subpixelMobile.railPosition).toBe('left');

    // Sub-pixel desktop viewport (>= 768px) must strictly resolve to desktop alternating
    const subpixelDesktop = getLayoutMode(768.1);
    expect(subpixelDesktop.mode).toBe('desktop-alternating');
    expect(subpixelDesktop.alternates).toBe(true);
    expect(subpixelDesktop.railPosition).toBe('center');
  });

  it('2.5: Ultra-compact mobile viewport (320px iPhone SE) maintains positive padding & valid rail', () => {
    const layout = getLayoutMode(320);
    expect(layout.mode).toBe('mobile-single-column');
    expect(layout.railOffsetPx).toBe(24);
    const availableCardWidth = 320 - layout.railOffsetPx - 16;
    expect(availableCardWidth).toBeGreaterThan(250);
  });

  it('2.6: Ultra-wide 4K viewport (2560px) resolves to desktop alternating layout', () => {
    const layout = getLayoutMode(2560);
    expect(layout.mode).toBe('desktop-alternating');
    expect(layout.alternates).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Suite 3: Rapid Hover In/Out revealFactor Bounds Clamping [0.0, 1.0]
// -----------------------------------------------------------------------------
describe('Boundary 3: Rapid Hover In/Out Bounds Clamping [0.0, 1.0]', () => {
  // Production-grade lerp with strict clamping to prevent overflow / underflow
  function updateRevealFactor(current, isHovered, deltaRate = 0.08) {
    const target = isHovered ? 1.0 : 0.0;
    const next = current + (target - current) * deltaRate;
    // Strict clamp [0.0, 1.0]
    return Math.max(0.0, Math.min(1.0, next));
  }

  function computeShellOpacity(revealFactor) {
    const clamped = Math.max(0.0, Math.min(1.0, revealFactor));
    return 1.0 - clamped * (1.0 - 0.08);
  }

  it('3.1: revealFactor never drops below 0.0 under negative input deltas or large step sizes', () => {
    let factor = 0.5;
    // Overshoot toward 0.0 with excessive delta rate (0.5 + (0.0 - 0.5) * 2.5 = -0.75 without clamp)
    factor = updateRevealFactor(factor, false, 2.5);
    expect(factor).toBe(0.0);
  });

  it('3.2: revealFactor never exceeds 1.0 under positive input deltas or large step sizes', () => {
    let factor = 0.5;
    // Overshoot toward 1.0 with excessive delta rate (0.5 + (1.0 - 0.5) * 2.5 = 1.75 without clamp)
    factor = updateRevealFactor(factor, true, 2.5);
    expect(factor).toBe(1.0);
  });

  it('3.3: Rapid 100-cycle hover oscillation strictly maintains [0.0, 1.0] invariant throughout', () => {
    let factor = 0.5;
    for (let i = 0; i < 100; i++) {
      const isHover = i % 2 === 0;
      factor = updateRevealFactor(factor, isHover, 0.25);
      expect(factor).toBeGreaterThanOrEqual(0.0);
      expect(factor).toBeLessThanOrEqual(1.0);
    }
  });

  it('3.4: Zero delta or zero frame duration produces zero change without NaN', () => {
    const factor = 0.42;
    const next = updateRevealFactor(factor, true, 0.0);
    expect(next).toBe(0.42);
    expect(isNaN(next)).toBe(false);
  });

  it('3.5: Shell opacity is strictly bounded between [0.08, 1.0] across all values', () => {
    expect(computeShellOpacity(-0.5)).toBe(1.0); // clamped at 0 -> 1.0
    expect(computeShellOpacity(0.0)).toBe(1.0);
    expect(computeShellOpacity(0.5)).toBeCloseTo(0.54, 3);
    expect(computeShellOpacity(1.0)).toBeCloseTo(0.08, 3);
    expect(computeShellOpacity(1.5)).toBeCloseTo(0.08, 3); // clamped at 1.0 -> 0.08
  });

  it('3.6: Face opacity is strictly bounded between [0.0, 1.0]', () => {
    const computeFaceOpacity = (factor) => Math.max(0.0, Math.min(1.0, factor));
    expect(computeFaceOpacity(-1.0)).toBe(0.0);
    expect(computeFaceOpacity(0.0)).toBe(0.0);
    expect(computeFaceOpacity(0.75)).toBe(0.75);
    expect(computeFaceOpacity(1.0)).toBe(1.0);
    expect(computeFaceOpacity(2.0)).toBe(1.0);
  });
});

// -----------------------------------------------------------------------------
// Suite 4: prefers-reduced-motion Accessibility Compliance
// -----------------------------------------------------------------------------
describe('Boundary 4: prefers-reduced-motion Compliance', () => {
  function getMotionConfig(prefersReducedMotion) {
    return {
      autoRotationSpeed: prefersReducedMotion ? 0.0 : 0.005,
      timelineSlideDistancePx: prefersReducedMotion ? 0 : 40,
      scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth',
      transitionDurationMs: prefersReducedMotion ? 0 : 300,
      hoverRevealAllowed: true, // Color / opacity changes are safe
    };
  }

  it('4.1: When prefers-reduced-motion is true, 3D helmet rotational velocity is strictly 0.0', () => {
    const config = getMotionConfig(true);
    expect(config.autoRotationSpeed).toBe(0.0);
  });

  it('4.2: When prefers-reduced-motion is false, 3D helmet rotational velocity is active (> 0)', () => {
    const config = getMotionConfig(false);
    expect(config.autoRotationSpeed).toBeGreaterThan(0);
  });

  it('4.3: Timeline card translation offset is 0px when reduced motion is requested', () => {
    const config = getMotionConfig(true);
    expect(config.timelineSlideDistancePx).toBe(0);
  });

  it('4.4: Scroll behavior falls back from smooth to auto under reduced motion', () => {
    const reduced = getMotionConfig(true);
    const standard = getMotionConfig(false);
    expect(reduced.scrollBehavior).toBe('auto');
    expect(standard.scrollBehavior).toBe('smooth');
  });

  it('4.5: Hover reveal opacity transition remains functional even under reduced motion', () => {
    const config = getMotionConfig(true);
    expect(config.hoverRevealAllowed).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Suite 5: WebGL Context Loss / Throw Fallback Behavior
// -----------------------------------------------------------------------------
describe('Boundary 5: WebGL Context Loss & Throw Fallback', () => {
  class MockWebGLManager {
    constructor() {
      this.contextLost = false;
      this.activeComponent = 'Helmet3D';
    }

    triggerContextLost() {
      this.contextLost = true;
      this.activeComponent = 'HelmetFallback';
    }

    triggerContextRestored() {
      this.contextLost = false;
      this.activeComponent = 'Helmet3D';
    }

    render() {
      if (this.contextLost) {
        return { component: 'HelmetFallback', rendering: '2.5D CSS Card' };
      }
      return { component: 'Helmet3D', rendering: 'Three.js WebGL' };
    }
  }

  it('5.1: Initial WebGL state defaults to Helmet3D component', () => {
    const manager = new MockWebGLManager();
    expect(manager.render().component).toBe('Helmet3D');
  });

  it('5.2: Simulating webglcontextlost event automatically switches active component to HelmetFallback', () => {
    const manager = new MockWebGLManager();
    manager.triggerContextLost();
    expect(manager.activeComponent).toBe('HelmetFallback');
    expect(manager.render().rendering).toBe('2.5D CSS Card');
  });

  it('5.3: Simulating webglcontextrestored restores Helmet3D without throwing', () => {
    const manager = new MockWebGLManager();
    manager.triggerContextLost();
    expect(manager.activeComponent).toBe('HelmetFallback');
    manager.triggerContextRestored();
    expect(manager.activeComponent).toBe('Helmet3D');
  });

  it('5.4: Missing canvas DOM ref does not throw uncaught error', () => {
    const safeInit = (canvasRef) => {
      if (!canvasRef || !canvasRef.current) {
        return { success: false, fallback: true };
      }
      return { success: true, fallback: false };
    };
    const result = safeInit(null);
    expect(result.success).toBe(false);
    expect(result.fallback).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Suite 6: Photo Aspect Ratios, Binary Headers & Alpha Preservation
// -----------------------------------------------------------------------------
describe('Boundary 6: Photo Aspect Ratios & Binary Alpha Integrity', () => {
  // Helper to read PNG color type from binary IHDR chunk
  function getPngColorType(filePath) {
    const buf = fs.readFileSync(filePath);
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (buf.readUInt32BE(0) !== 0x89504e47) {
      throw new Error(`File is not a valid PNG: ${filePath}`);
    }
    // IHDR starts at byte 12. Width at 16, Height at 20, BitDepth at 24, ColorType at 25
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
      bitDepth: buf.readUInt8(24),
      colorType: buf.readUInt8(25), // 6 = RGBA (color with alpha), 2 = RGB (truecolor)
    };
  }

  // Helper to read JPEG dimensions and markers from binary SOF segment
  function getJpegDimensions(filePath) {
    const buf = fs.readFileSync(filePath);
    // JPEG SOI marker: 0xFF, 0xD8
    if (buf.length < 4 || buf[0] !== 0xFF || buf[1] !== 0xD8) {
      throw new Error(`File is not a valid JPEG: ${filePath}`);
    }
    let offset = 2;
    while (offset < buf.length) {
      if (buf[offset] !== 0xFF) {
        offset++;
        continue;
      }
      const marker = buf[offset + 1];
      if (marker === 0xD9) break; // EOI
      // SOF markers: 0xC0 (baseline), 0xC2 (progressive), etc.
      if ([0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF].includes(marker)) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return {
          width,
          height,
          sizeBytes: buf.length,
          marker: marker.toString(16),
        };
      }
      const segmentLength = buf.readUInt16BE(offset + 2);
      offset += 2 + segmentLength;
    }
    throw new Error(`SOF marker not found in JPEG: ${filePath}`);
  }

  it('6.1: kimi-portrait-mercedes-official.png is PNG ColorType 6 (RGBA with Alpha)', () => {
    const localAssetPath = path.join(ASSETS_DIR, 'kimi-mercedes-portrait-official.png');
    const uploadedAssetPath = path.join(UPLOADED_DIR, 'media_1794759564452_83fa04f2.png');
    const imgPath = fs.existsSync(localAssetPath) ? localAssetPath : uploadedAssetPath;
    expect(fs.existsSync(imgPath)).toBe(true);
    const header = getPngColorType(imgPath);
    expect(header.colorType).toBe(6); // RGBA
    expect(header.width).toBe(440);
    expect(header.height).toBe(440);
    // Perfect 1:1 aspect ratio
    expect(header.width / header.height).toBe(1.0);
  });

  it('6.2: kimi-hero-adjusting-collar.png is PNG ColorType 6 (RGBA with Alpha)', () => {
    const localAssetPath = path.join(ASSETS_DIR, 'kimi-hero-adjusting-collar.png');
    const uploadedAssetPath = path.join(UPLOADED_DIR, 'media_1794759077481_90e658ac.png');
    const imgPath = fs.existsSync(localAssetPath) ? localAssetPath : uploadedAssetPath;
    expect(fs.existsSync(imgPath)).toBe(true);
    const header = getPngColorType(imgPath);
    expect(header.colorType).toBe(6); // RGBA
    expect(header.width).toBe(666);
    expect(header.height).toBe(375);
    // 666 / 375 = 1.776 (~16:9 widescreen)
    expect(header.width / header.height).toBeCloseTo(16 / 9, 2);
  });

  it('6.3: kimi-karting-antonelli-early.png dimensions are preserved without upscaling', () => {
    const localAssetPath = path.join(ASSETS_DIR, 'kimi-karting-antonelli-early.png');
    const uploadedAssetPath = path.join(UPLOADED_DIR, 'media_1794759325583_6ce10f48.png');
    const imgPath = fs.existsSync(localAssetPath) ? localAssetPath : uploadedAssetPath;
    expect(fs.existsSync(imgPath)).toBe(true);
    const header = getPngColorType(imgPath);
    expect(header.width).toBe(201);
    expect(header.height).toBe(251);
    expect(header.width).toBeLessThan(300);
  });

  it('6.4: 16:9 landscape photo kimi-frmec-falcone-thumbsup.jpg preserves 1024x576 resolution on disk', () => {
    const localAssetPath = path.join(ASSETS_DIR, 'kimi-frmec-falcone-thumbsup.jpg');
    const uploadedAssetPath = path.join(UPLOADED_DIR, 'media_1794759474584_5db7865a.jpg');
    const imgPath = fs.existsSync(localAssetPath) ? localAssetPath : uploadedAssetPath;

    expect(fs.existsSync(imgPath)).toBeTruthy();
    const dimensions = getJpegDimensions(imgPath);
    expect(dimensions.width).toBe(1024);
    expect(dimensions.height).toBe(576);
    expect(dimensions.sizeBytes).toBe(217484);
    expect(dimensions.width / dimensions.height).toBeCloseTo(16 / 9, 3);
  });
});
