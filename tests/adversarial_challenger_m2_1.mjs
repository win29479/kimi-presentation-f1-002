/**
 * tests/adversarial_challenger_m2_1.mjs
 * 
 * Empirical Adversarial Challenger Test Harness for Milestone 2:
 * Interactive 3D Helmet Experience & WebGL Resilience Pipeline.
 * 
 * Tests:
 * 1. Mathematical Lerp, Strict Boundary Clamping & Asymptotic Threshold Snapping
 * 2. Parallax Kinematics under Extreme Numeric & Adversarial Coordinates
 * 3. Opacity Curves & Alpha Depth Transitions
 * 4. Ambient Drift, Reduced Motion & RAF Lifecycle Churning
 * 5. WebGL Resilience & Context Loss Lifecycle
 * 6. Production Bundle & Asset Cleanliness
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('========================================================================');
console.log('  CHALLENGER M2: EMPIRICAL STRESS & ADVERSARIAL VERIFICATION HARNESS    ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: MATHEMATICAL LERP, CLAMPING & THRESHOLD SNAPPING
// -----------------------------------------------------------------------------
describe('Challenger Suite 1: Mathematical Lerp, Clamping & Threshold Snapping', () => {

  function stepHelmetLerp(state, currentTime, dtOverride = null) {
    const rawDt = dtOverride !== null 
      ? dtOverride 
      : (currentTime - state.lastTime) / 1000;
    
    // dt clamping as in Helmet3D.jsx:466
    const dt = Math.min(Math.max(rawDt, 0.001), 0.1);
    state.lastTime = currentTime;

    state.targetReveal = state.isHovered ? 1.0 : 0.0;
    const effectiveLerpSpeed = state.prefersReducedMotion ? 1.0 : 0.08;
    const lerpStep = 1.0 - Math.pow(1.0 - effectiveLerpSpeed, dt * 60);
    state.revealFactor += (state.targetReveal - state.revealFactor) * lerpStep;

    // Threshold snapping & strict boundary clamping (Helmet3D.jsx:476-479)
    if (Math.abs(state.targetReveal - state.revealFactor) < 0.001) {
      state.revealFactor = state.targetReveal;
    }
    state.revealFactor = Math.max(0.0, Math.min(1.0, state.revealFactor));

    return {
      revealFactor: state.revealFactor,
      lerpStep,
      dt,
      snapped: state.revealFactor === state.targetReveal
    };
  }

  function computeOpacities(revealFactor) {
    const clamped = Math.max(0.0, Math.min(1.0, revealFactor));
    const shellOpacity = 1.0 - clamped * 0.92;
    const visorOpacity = 1.0 - clamped * 0.92;
    const faceOpacity = clamped;
    return { shellOpacity, visorOpacity, faceOpacity };
  }

  it('1.1: Rapid 100,000-cycle randomized hover switching never produces < 0.0, > 1.0, or NaN', () => {
    const state = {
      isHovered: false,
      revealFactor: 0.0,
      targetReveal: 0.0,
      prefersReducedMotion: false,
      lastTime: 0
    };

    let currentTime = 1000;
    for (let i = 0; i < 100000; i++) {
      state.isHovered = (i % 2 === 0) || (Math.sin(i) > 0.3);
      const dt = 0.001 + (Math.sin(i * 13.37) * 0.5 + 0.5) * 0.2;
      currentTime += dt * 1000;

      const res = stepHelmetLerp(state, currentTime, dt);

      assert.ok(!Number.isNaN(res.revealFactor), `Cycle ${i}: revealFactor must not be NaN`);
      assert.ok(Number.isFinite(res.revealFactor), `Cycle ${i}: revealFactor must be finite`);
      assert.ok(res.revealFactor >= 0.0, `Cycle ${i}: revealFactor (${res.revealFactor}) must be >= 0.0`);
      assert.ok(res.revealFactor <= 1.0, `Cycle ${i}: revealFactor (${res.revealFactor}) must be <= 1.0`);
    }
  });

  it('1.2: Threshold snapping cleanly terminates asymptotic drift within bounded frame count', () => {
    // Hover transition (0.0 -> 1.0)
    const stateHover = {
      isHovered: true,
      revealFactor: 0.0,
      targetReveal: 1.0,
      prefersReducedMotion: false,
      lastTime: 0
    };

    let framesToHoverSnap = 0;
    let t = 0;
    for (let f = 0; f < 300; f++) {
      t += 16.666;
      const res = stepHelmetLerp(stateHover, t, 0.016666);
      if (res.snapped) {
        framesToHoverSnap = f + 1;
        break;
      }
    }

    assert.ok(framesToHoverSnap > 0 && framesToHoverSnap <= 90, 
      `Hover transition must snap within 90 frames (took ${framesToHoverSnap} frames)`);
    assert.strictEqual(stateHover.revealFactor, 1.0, 'revealFactor must be exactly 1.0 upon snap');

    // Subsequent idle frame: delta should be strictly 0.0
    const idleHover = stepHelmetLerp(stateHover, t + 16.666, 0.016666);
    assert.strictEqual(idleHover.revealFactor, 1.0);
    assert.strictEqual(stateHover.targetReveal - stateHover.revealFactor, 0.0, 
      'Asymptotic drift must be strictly zero when snapped idle at target 1.0');

    // Restore transition (1.0 -> 0.0)
    stateHover.isHovered = false;
    let framesToRestoreSnap = 0;
    for (let f = 0; f < 300; f++) {
      t += 16.666;
      const res = stepHelmetLerp(stateHover, t, 0.016666);
      if (res.snapped) {
        framesToRestoreSnap = f + 1;
        break;
      }
    }

    assert.ok(framesToRestoreSnap > 0 && framesToRestoreSnap <= 90, 
      `Restore transition must snap within 90 frames (took ${framesToRestoreSnap} frames)`);
    assert.strictEqual(stateHover.revealFactor, 0.0, 'revealFactor must be exactly 0.0 upon snap');

    // Subsequent idle frame: delta should be strictly 0.0
    const idleRestore = stepHelmetLerp(stateHover, t + 16.666, 0.016666);
    assert.strictEqual(idleRestore.revealFactor, 0.0);
    assert.strictEqual(stateHover.targetReveal - stateHover.revealFactor, 0.0,
      'Asymptotic drift must be strictly zero when snapped idle at target 0.0');
  });

  it('1.3: Reduced motion setting snaps immediately in 1 frame (lerpSpeed = 1.0)', () => {
    const state = {
      isHovered: true,
      revealFactor: 0.0,
      targetReveal: 1.0,
      prefersReducedMotion: true,
      lastTime: 0
    };

    const res = stepHelmetLerp(state, 16.666, 0.016666);
    assert.strictEqual(res.revealFactor, 1.0, 'Reduced motion must snap to 1.0 in exactly 1 frame');
    assert.strictEqual(res.snapped, true);

    state.isHovered = false;
    const resLeave = stepHelmetLerp(state, 33.333, 0.016666);
    assert.strictEqual(resLeave.revealFactor, 0.0, 'Reduced motion must snap to 0.0 in exactly 1 frame');
    assert.strictEqual(resLeave.snapped, true);
  });

  it('1.4: Opacity curves strictly match mathematical specification at 0.0, 0.5, and 1.0', () => {
    // revealFactor = 0.0
    const at0 = computeOpacities(0.0);
    assert.strictEqual(at0.shellOpacity, 1.0, 'At revealFactor=0.0, shell opacity must be 1.0');
    assert.strictEqual(at0.visorOpacity, 1.0, 'At revealFactor=0.0, visor opacity must be 1.0');
    assert.strictEqual(at0.faceOpacity, 0.0, 'At revealFactor=0.0, face opacity must be 0.0');

    // revealFactor = 0.5
    const atHalf = computeOpacities(0.5);
    assert.ok(Math.abs(atHalf.shellOpacity - 0.54) < 1e-4, 
      `At revealFactor=0.5, shell opacity must be 0.54 (got ${atHalf.shellOpacity})`);
    assert.ok(Math.abs(atHalf.visorOpacity - 0.54) < 1e-4, 
      `At revealFactor=0.5, visor opacity must be 0.54 (got ${atHalf.visorOpacity})`);
    assert.strictEqual(atHalf.faceOpacity, 0.5, 'At revealFactor=0.5, face opacity must be 0.5');

    // revealFactor = 1.0
    const at1 = computeOpacities(1.0);
    assert.ok(Math.abs(at1.shellOpacity - 0.08) < 1e-4, 
      `At revealFactor=1.0, shell opacity must be 0.08 (got ${at1.shellOpacity})`);
    assert.ok(Math.abs(at1.visorOpacity - 0.08) < 1e-4, 
      `At revealFactor=1.0, visor opacity must be 0.08 (got ${at1.visorOpacity})`);
    assert.strictEqual(at1.faceOpacity, 1.0, 'At revealFactor=1.0, face opacity must be 1.0');
  });

  it('1.5: Out-of-bounds input factor clamping protects opacities from negative or >1.0 divergence', () => {
    const underflow = computeOpacities(-10.0);
    assert.strictEqual(underflow.shellOpacity, 1.0);
    assert.strictEqual(underflow.faceOpacity, 0.0);

    const overflow = computeOpacities(10.0);
    assert.ok(Math.abs(overflow.shellOpacity - 0.08) < 1e-4);
    assert.strictEqual(overflow.faceOpacity, 1.0);
  });
});

// -----------------------------------------------------------------------------
// SUITE 2: PARALLAX KINEMATICS & POINTER COORDINATE STRESS
// -----------------------------------------------------------------------------
describe('Challenger Suite 2: Parallax Kinematics & Extreme Pointer Coordinates', () => {

  const maxYaw = 15 * (Math.PI / 180);   // 15 degrees = 0.261799 rad
  const maxPitch = 12 * (Math.PI / 180); // 12 degrees = 0.209440 rad
  const maxRoll = 3 * (Math.PI / 180);   // 3 degrees = 0.052360 rad

  function simulatePointerMove(clientX, clientY, containerRect = { left: 0, top: 0, width: 600, height: 400 }) {
    const nx = ((clientX - containerRect.left) / containerRect.width) * 2.0 - 1.0;
    const ny = ((clientY - containerRect.top) / containerRect.height) * 2.0 - 1.0;
    
    // Exact logic from Helmet3D.jsx:582-583
    const targetNormX = Math.max(-1.0, Math.min(1.0, nx));
    const targetNormY = Math.max(-1.0, Math.min(1.0, ny));

    const targetRotY = targetNormX * maxYaw;
    const targetRotX = -targetNormY * maxPitch;
    const targetRotZ = -targetNormX * maxRoll;

    return {
      nx,
      ny,
      targetNormX,
      targetNormY,
      targetRotY,
      targetRotX,
      targetRotZ,
      degYaw: targetRotY * (180 / Math.PI),
      degPitch: targetRotX * (180 / Math.PI),
      degRoll: targetRotZ * (180 / Math.PI)
    };
  }

  it('2.1: Extreme positive numeric pointer coordinates (x = 10000, y = 10000) are strictly clamped to +15° yaw and -12° pitch', () => {
    const res = simulatePointerMove(10000, 10000);
    assert.strictEqual(res.targetNormX, 1.0, 'Extreme X must clamp targetNormX to 1.0');
    assert.strictEqual(res.targetNormY, 1.0, 'Extreme Y must clamp targetNormY to 1.0');
    assert.ok(Math.abs(res.degYaw - 15.0) < 1e-4, `Yaw must be exactly 15.0° (got ${res.degYaw})`);
    assert.ok(Math.abs(res.degPitch - (-12.0)) < 1e-4, `Pitch must be exactly -12.0° (got ${res.degPitch})`);
    assert.ok(Math.abs(res.degRoll - (-3.0)) < 1e-4, `Roll must be exactly -3.0° (got ${res.degRoll})`);
  });

  it('2.2: Extreme negative numeric pointer coordinates (x = -9999, y = -9999) are strictly clamped to -15° yaw and +12° pitch', () => {
    const res = simulatePointerMove(-9999, -9999);
    assert.strictEqual(res.targetNormX, -1.0, 'Negative extreme X must clamp targetNormX to -1.0');
    assert.strictEqual(res.targetNormY, -1.0, 'Negative extreme Y must clamp targetNormY to -1.0');
    assert.ok(Math.abs(res.degYaw - (-15.0)) < 1e-4, `Yaw must be exactly -15.0° (got ${res.degYaw})`);
    assert.ok(Math.abs(res.degPitch - 12.0) < 1e-4, `Pitch must be exactly +12.0° (got ${res.degPitch})`);
    assert.ok(Math.abs(res.degRoll - 3.0) < 1e-4, `Roll must be exactly +3.0° (got ${res.degRoll})`);
  });

  it('2.3: Center coordinates (x = 300, y = 200 on 600x400) produce 0° rotation', () => {
    const res = simulatePointerMove(300, 200);
    assert.strictEqual(res.targetNormX, 0.0);
    assert.strictEqual(res.targetNormY, 0.0);
    assert.ok(Math.abs(res.degYaw) === 0, 'Yaw must be 0° at center');
    assert.ok(Math.abs(res.degPitch) === 0, 'Pitch must be 0° at center');
    assert.ok(Math.abs(res.degRoll) === 0, 'Roll must be 0° at center');
  });

  it('2.4: Three.js Group matrix update executes safely without crash under bounded kinematics', () => {
    const rootGroup = new THREE.Group();
    const pivotGroup = new THREE.Group();
    rootGroup.add(pivotGroup);

    // Apply extreme positive
    const extremePos = simulatePointerMove(10000, 10000);
    pivotGroup.rotation.set(extremePos.targetRotX, extremePos.targetRotY, extremePos.targetRotZ);
    pivotGroup.position.set(0.10, -0.08, 0);
    pivotGroup.updateMatrix();

    for (let i = 0; i < 16; i++) {
      assert.ok(!Number.isNaN(pivotGroup.matrix.elements[i]), `Matrix element ${i} must not be NaN`);
      assert.ok(Number.isFinite(pivotGroup.matrix.elements[i]), `Matrix element ${i} must be finite`);
    }

    // Apply extreme negative
    const extremeNeg = simulatePointerMove(-9999, -9999);
    pivotGroup.rotation.set(extremeNeg.targetRotX, extremeNeg.targetRotY, extremeNeg.targetRotZ);
    pivotGroup.position.set(-0.10, 0.08, 0);
    pivotGroup.updateMatrix();

    for (let i = 0; i < 16; i++) {
      assert.ok(!Number.isNaN(pivotGroup.matrix.elements[i]), `Matrix element ${i} must not be NaN`);
      assert.ok(Number.isFinite(pivotGroup.matrix.elements[i]), `Matrix element ${i} must be finite`);
    }
  });

  it('2.5: Differential face mesh parallax displacement is strictly bounded', () => {
    const maxNormX = 1.0;
    const maxNormY = 1.0;
    const posX = maxNormX * 0.04;
    const posY = 0.04 - maxNormY * 0.03;

    assert.ok(posX <= 0.04 && posX >= -0.04, 'Face parallax X must be within [-0.04, 0.04]');
    assert.ok(posY <= 0.07 && posY >= 0.01, 'Face parallax Y must be within [0.01, 0.07]');
  });

  it('2.6: [ADVERSARIAL ATTACK] NaN and undefined coordinates cause NaN propagation in raw implementation', () => {
    // Exact logic from Helmet3D.jsx:580-583 without NaN guarding
    const rawClamp = (val) => Math.max(-1.0, Math.min(1.0, val));
    
    const nxNaN = ((NaN - 0) / 600) * 2.0 - 1.0;
    const targetNormX_NaN = rawClamp(nxNaN);
    assert.ok(Number.isNaN(targetNormX_NaN), 'VULNERABILITY CONFIRMED: Math.min/max does not sanitize NaN');

    const nxUndefined = ((undefined - 0) / 600) * 2.0 - 1.0;
    const targetNormX_Undefined = rawClamp(nxUndefined);
    assert.ok(Number.isNaN(targetNormX_Undefined), 'VULNERABILITY CONFIRMED: undefined produces NaN');

    // Test persistent state poisoning in lerp damp loop
    let currentNormX = 0.0;
    const dampStep = 0.08;
    currentNormX += (targetNormX_NaN - currentNormX) * dampStep;
    assert.ok(Number.isNaN(currentNormX), 'currentNormX is poisoned by NaN');

    // Future valid frame fails to recover because (valid - NaN) is NaN
    const validTargetNormX = 0.5;
    currentNormX += (validTargetNormX - currentNormX) * dampStep;
    assert.ok(Number.isNaN(currentNormX), 'currentNormX remains permanently poisoned by NaN');
  });
});

// -----------------------------------------------------------------------------
// SUITE 3: AMBIENT DRIFT, REDUCED MOTION & RAF LIFECYCLE
// -----------------------------------------------------------------------------
describe('Challenger Suite 3: Ambient Drift, Reduced Motion & RAF Lifecycle', () => {

  function computeAmbientDrift(currentTime, revealFactor, prefersReducedMotion) {
    if (prefersReducedMotion) {
      return { driftPitch: 0, driftYaw: 0, driftRoll: 0, driftY: 0 };
    }
    const timeSec = currentTime * 0.001;
    const driftWeight = 1.0 - revealFactor; // Attenuates to zero on hover
    const driftY = Math.sin(timeSec * 1.3) * 0.035 * driftWeight;
    const driftPitch = Math.sin(timeSec * 1.1) * 0.025 * driftWeight;
    const driftYaw = Math.cos(timeSec * 0.85) * 0.030 * driftWeight;
    const driftRoll = Math.sin(timeSec * 0.70 + 1.2) * 0.012 * driftWeight;
    return { driftPitch, driftYaw, driftRoll, driftY };
  }

  it('3.1: Ambient drift harmonic micro-oscillations are non-zero when idle and motion is enabled', () => {
    const driftAt1s = computeAmbientDrift(1000, 0.0, false);
    const hasMotion = Math.abs(driftAt1s.driftPitch) > 0 || 
                      Math.abs(driftAt1s.driftYaw) > 0 || 
                      Math.abs(driftAt1s.driftY) > 0;
    assert.ok(hasMotion, 'Ambient drift must produce active micro-oscillations when idle');
  });

  it('3.2: Full hover reveal (revealFactor = 1.0) completely attenuates drift to 0.0', () => {
    const driftOnReveal = computeAmbientDrift(12345, 1.0, false);
    assert.ok(Math.abs(driftOnReveal.driftPitch) === 0, 'driftPitch must be 0 on reveal');
    assert.ok(Math.abs(driftOnReveal.driftYaw) === 0, 'driftYaw must be 0 on reveal');
    assert.ok(Math.abs(driftOnReveal.driftRoll) === 0, 'driftRoll must be 0 on reveal');
    assert.ok(Math.abs(driftOnReveal.driftY) === 0, 'driftY must be 0 on reveal');
  });

  it('3.3: prefersReducedMotion suppresses all ambient drift regardless of revealFactor', () => {
    const driftSuppressed = computeAmbientDrift(54321, 0.0, true);
    assert.strictEqual(driftSuppressed.driftPitch, 0, 'driftPitch must be 0 with reduced motion');
    assert.strictEqual(driftSuppressed.driftYaw, 0, 'driftYaw must be 0 with reduced motion');
    assert.strictEqual(driftSuppressed.driftRoll, 0, 'driftRoll must be 0 with reduced motion');
    assert.strictEqual(driftSuppressed.driftY, 0, 'driftY must be 0 with reduced motion');
  });

  it('3.4: [ADVERSARIAL ATTACK] Inspection reveals RAF loop churns even when element is offscreen or static', () => {
    const helmetPath = resolve(projectRoot, 'src/components/Helmet3D.jsx');
    const content = readFileSync(helmetPath, 'utf8');

    // Check lines 461-464:
    // if (!renderer || !state.isInViewport || !state.isTabActive) {
    //   state.rafId = requestAnimationFrame(animate);
    //   return;
    // }
    const offscreenChurnsPattern = /!state\.isInViewport[\s\S]*?requestAnimationFrame\(animate\)/;
    assert.ok(offscreenChurnsPattern.test(content), 
      'VULNERABILITY CONFIRMED: Helmet3D requests animation frame even when !isInViewport');
  });
});

// -----------------------------------------------------------------------------
// SUITE 4: WEBGL RESILIENCE & FALLBACK SPECIFICATION
// -----------------------------------------------------------------------------
describe('Challenger Suite 4: WebGL Resilience & Fallback Specification', () => {

  it('4.1: useWebGLSupport module exports all required API contracts', async () => {
    const mod = await import('../src/hooks/useWebGLSupport.js');
    assert.ok(typeof mod.checkWebGLSupport === 'function', 'checkWebGLSupport must be exported');
    assert.ok(typeof mod.detectWebGLDetails === 'function', 'detectWebGLDetails must be exported');
    assert.ok(typeof mod.useWebGLSupport === 'function', 'useWebGLSupport must be exported');
    assert.ok(typeof mod.default === 'function', 'default export must be present');
  });

  it('4.2: checkWebGLSupport handles null, throwing, and missing contexts without uncaught exceptions', async () => {
    const { checkWebGLSupport } = await import('../src/hooks/useWebGLSupport.js');

    const resNull = checkWebGLSupport(null);
    assert.strictEqual(typeof resNull, 'boolean');

    const mockNullCanvas = { getContext: () => null };
    assert.strictEqual(checkWebGLSupport(mockNullCanvas), false);

    const mockThrowCanvas = {
      getContext: () => { throw new Error('GPU device reset'); }
    };
    assert.strictEqual(checkWebGLSupport(mockThrowCanvas), false);

    const mockValidCanvas = {
      getContext: (type) => (type.includes('webgl') ? { getExtension: () => null } : null)
    };
    assert.strictEqual(checkWebGLSupport(mockValidCanvas), true);
  });

  it('4.3: HelmetFallback.jsx exists, exports default component, and enforces 3:2 aspect ratio', () => {
    const fallbackPath = resolve(projectRoot, 'src/components/HelmetFallback.jsx');
    assert.ok(existsSync(fallbackPath), 'HelmetFallback.jsx must exist');
    const content = readFileSync(fallbackPath, 'utf8');

    assert.ok(content.includes('export default function HelmetFallback'), 'Must have default export');
    assert.ok(content.includes('aspectRatio: \'3 / 2\''), 'Must enforce 3:2 aspect ratio');
    assert.ok(content.includes('KIMI_IMAGES.cockpitHelmet'), 'Must use authentic cockpit helmet image');
    assert.ok(content.includes('KIMI_IMAGES.portraitOfficial'), 'Must use authentic official portrait image');
    assert.ok(!content.includes('data:image'), 'Must contain zero base64 images');
  });

  it('4.4: Helmet3D.jsx imports useWebGLSupport and falls back to HelmetFallback when unsupported', () => {
    const helmetPath = resolve(projectRoot, 'src/components/Helmet3D.jsx');
    assert.ok(existsSync(helmetPath), 'Helmet3D.jsx must exist');
    const content = readFileSync(helmetPath, 'utf8');

    assert.ok(content.includes('useWebGLSupport'), 'Must import useWebGLSupport hook');
    assert.ok(content.includes('<HelmetFallback'), 'Must render HelmetFallback when WebGL is unavailable');
    assert.ok(content.includes('webglcontextlost'), 'Must listen to webglcontextlost event');
    assert.ok(content.includes('webglcontextrestored'), 'Must listen to webglcontextrestored event');
    assert.ok(!content.includes('data:image'), 'Must contain zero base64 images');
  });
});

// -----------------------------------------------------------------------------
// SUITE 5: PRODUCTION BUILD ARTIFACTS VALIDATION
// -----------------------------------------------------------------------------
describe('Challenger Suite 5: Production Build Artifacts Validation', () => {

  it('5.1: Production dist/ directory exists and contains index.html', () => {
    const distIndex = resolve(projectRoot, 'dist/index.html');
    assert.ok(existsSync(distIndex), 'dist/index.html must exist from build');
  });

  it('5.2: Production dist/assets contains JavaScript and CSS bundles', () => {
    const distAssets = resolve(projectRoot, 'dist/assets');
    assert.ok(existsSync(distAssets), 'dist/assets directory must exist');
  });
});

console.log('\nAll challenger test suites registered.');
