/**
 * empirical_challenger_m2_2.mjs
 * Comprehensive Empirical Adversarial Stress Test Suite for Milestone 2:
 * Interactive 3D Helmet Experience & WebGL Resilience Pipeline.
 *
 * Covers:
 *   1. WebGL Feature Detection, Software Rasterizer Detection & Context Loss Resilience
 *   2. Procedural Three.js Geometries, Symmetry, Orientation & Alpha Lerp Math
 *   3. Lifecycle Resource Disposal, Deep Traversal & Memory Leak Stress (50 cycles)
 *   4. Mobile Touch Gesture Differentiation (Tap vs Drag vs Long Press) & Touch-Action
 *   5. WebGL Context Loss Fallback Switching, 2.5D Card Layout & Accessibility
 *   6. Production Build Verification & Asset Integrity
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as THREE from 'three';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

// Import pure JS hook functions directly
import { checkWebGLSupport, detectWebGLDetails } from '../src/hooks/useWebGLSupport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const suite = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: [],
  categories: {}
};

function assert(category, condition, description, details = null) {
  suite.total++;
  if (!suite.categories[category]) {
    suite.categories[category] = { total: 0, passed: 0, failed: 0 };
  }
  suite.categories[category].total++;

  if (condition) {
    suite.passed++;
    suite.categories[category].passed++;
    console.log(`  [PASS] [${category}] ${description}`);
  } else {
    suite.failed++;
    suite.categories[category].failed++;
    const failObj = { category, description, details };
    suite.failures.push(failObj);
    console.error(`  [FAIL] [${category}] ${description}`, details !== null ? details : '');
  }
}

console.log('========================================================================');
console.log('      EMPIRICAL CHALLENGER M2-2: 3D HELMET & RESILIENCE STRESS SUITE     ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// 1. WebGL Feature Detection, Software Rasterizer Detection & Context Loss
// -----------------------------------------------------------------------------
console.log('>>> 1. WebGL Feature Detection & Context Resilience (useWebGLSupport.js)');

// In Node SSR environment, checkWebGLSupport(undefined) returns safe true default
assert('WebGL Hook', checkWebGLSupport(undefined) === true, '1.1: checkWebGLSupport(undefined) returns SSR-safe default (true)');

// Test mockCanvas with webgl2
const mockCanvasWebGL2 = {
  getContext: (type) => (type === 'webgl2' ? { getExtension: () => null } : null)
};
assert('WebGL Hook', checkWebGLSupport(mockCanvasWebGL2) === true, '1.2: checkWebGLSupport detects webgl2 context');

// Test mockCanvas with webgl1
const mockCanvasWebGL1 = {
  getContext: (type) => (type === 'webgl' ? { getExtension: () => null } : null)
};
assert('WebGL Hook', checkWebGLSupport(mockCanvasWebGL1) === true, '1.3: checkWebGLSupport detects webgl fallback context');

// Test mockCanvas with no WebGL
const mockCanvasNoGL = {
  getContext: () => null
};
assert('WebGL Hook', checkWebGLSupport(mockCanvasNoGL) === false, '1.4: checkWebGLSupport returns false when no GL context available');

// Test mockCanvas throwing on getContext
const mockCanvasThrowing = {
  getContext: () => { throw new Error('Simulated GPU driver crash'); }
};
assert('WebGL Hook', checkWebGLSupport(mockCanvasThrowing) === false, '1.5: checkWebGLSupport catches thrown GPU crash and returns false');

// Mock DOM environment for browser-like testing
const origWindow = globalThis.window;
const origDocument = globalThis.document;

let loseContextCalled = false;
globalThis.window = {};
globalThis.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        getContext: (type, opts) => {
          if (opts && opts.failIfMajorPerformanceCaveat) {
            // Hardware acceleration disabled
            return null;
          }
          if (type === 'webgl2' || type === 'webgl') {
            return {
              getExtension: (ext) => {
                if (ext === 'WEBGL_debug_renderer_info') {
                  return { UNMASKED_RENDERER_WEBGL: 0x9246 };
                }
                if (ext === 'WEBGL_lose_context') {
                  return {
                    loseContext: () => { loseContextCalled = true; }
                  };
                }
                return null;
              },
              getParameter: (param) => {
                if (param === 0x9246) {
                  return 'Google SwiftShader Software Rasterizer';
                }
                return '';
              }
            };
          }
          return null;
        }
      };
    }
    return {};
  }
};

// Now test with browser DOM mocked
assert('WebGL Hook', checkWebGLSupport() === true, '1.6: checkWebGLSupport() in browser context detects available WebGL');

loseContextCalled = false;
const softwareDetails = detectWebGLDetails();
assert('WebGL Hook', softwareDetails.isSupported === true, '1.7: detectWebGLDetails identifies WebGL support under software rendering');
assert('WebGL Hook', softwareDetails.isSoftware === true, '1.8: detectWebGLDetails flags SwiftShader as isSoftware = true');
assert('WebGL Hook', loseContextCalled === true, '1.9: detectWebGLDetails calls WEBGL_lose_context.loseContext() to reclaim temporary memory');

// Test complete failure in detectWebGLDetails
globalThis.document.createElement = () => ({
  getContext: () => null
});
const failDetails = detectWebGLDetails();
assert('WebGL Hook', failDetails.isSupported === false, '1.10: detectWebGLDetails returns isSupported = false when all contexts fail');
assert('WebGL Hook', typeof failDetails.error === 'string', '1.11: detectWebGLDetails populates error string on failure');

// Test throwing in detectWebGLDetails
globalThis.document.createElement = () => ({
  getContext: () => { throw new Error('Out of memory'); }
});
const throwDetails = detectWebGLDetails();
assert('WebGL Hook', throwDetails.isSupported === false, '1.12: detectWebGLDetails catches context creation exception gracefully');
assert('WebGL Hook', throwDetails.error.includes('Out of memory'), '1.13: detectWebGLDetails captures thrown exception message');

// Restore DOM
globalThis.window = origWindow;
globalThis.document = origDocument;

// -----------------------------------------------------------------------------
// 2. Procedural Three.js Geometries, Materials, Livery Canvas & Lerp Math
// -----------------------------------------------------------------------------
console.log('\n>>> 2. Procedural Three.js Geometries, Livery Canvas & Lerp Math');

// Bundle Helmet3D via Vite in-memory build
const bundleOut = await build({
  configFile: false,
  plugins: [react()],
  build: {
    write: false,
    lib: {
      entry: './src/components/Helmet3D.jsx',
      formats: ['es']
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'three']
    }
  }
});

const bundleCode = bundleOut[0].output.find(c => c.fileName.endsWith('.js') || c.fileName.endsWith('.mjs'))?.code;
assert('3D Engine', !!bundleCode && bundleCode.length > 5000, '2.1: Helmet3D.jsx compiles into production ES bundle');

// Write bundle to a temporary test file for dynamic module execution
const tempBundlePath = path.join(__dirname, '.tmp_helmet3d_challenge.mjs');
fs.writeFileSync(tempBundlePath, bundleCode);
const Helmet3DModule = await import('./.tmp_helmet3d_challenge.mjs');
const Helmet3DComponent = Helmet3DModule.default;
assert('3D Engine', typeof Helmet3DComponent === 'function', '2.2: Helmet3D exports a valid React component function');

// Clean up temp file
try { fs.unlinkSync(tempBundlePath); } catch {}

// Test Procedural Cranial Shell Geometry
function createTestHelmetShell() {
  const geom = new THREE.SphereGeometry(1.20, 64, 48);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x0 = pos.getX(i);
    const y0 = pos.getY(i);
    const z0 = pos.getZ(i);
    const nx = x0 / 1.20;
    const ny = y0 / 1.20;
    const nz = z0 / 1.20;
    let x = nx * 0.94;
    let y = ny * 1.05;
    let z = nz * 1.08;
    if (ny < -0.60) {
      const neckProgress = (-ny - 0.60) / 0.40;
      y = -0.60 * 1.05 - neckProgress * 0.08;
      const neckFlare = 1.0 + neckProgress * 0.12;
      x *= neckFlare;
      z *= neckFlare;
    }
    if (nz > 0) {
      if (ny > 0.18 && ny < 0.52) {
        const browEnvelope = Math.sin(((ny - 0.18) / 0.34) * Math.PI);
        const lateralFalloff = Math.max(0.0, 1.0 - (nx * nx) * 1.5);
        z += browEnvelope * lateralFalloff * 0.14;
      }
      if (ny >= -0.10 && ny <= 0.28) {
        const eyeEnvelope = Math.cos(((ny - 0.09) / 0.19) * (Math.PI * 0.5));
        const lateralFalloff = Math.max(0.0, 1.0 - Math.pow(nx / 0.75, 4.0));
        z -= eyeEnvelope * lateralFalloff * 0.08;
      }
      if (ny < 0.0 && ny > -0.60) {
        const chinProgress = (-ny) / 0.60;
        const chinPunch = Math.sin(chinProgress * Math.PI * 0.85) * 0.26;
        const lateralFalloff = Math.max(0.0, 1.0 - Math.abs(nx) * 0.85);
        z += chinPunch * lateralFalloff;
        x *= (1.0 - chinProgress * 0.14);
      }
    } else {
      if (ny > -0.20 && ny < 0.35) {
        const rearAero = Math.sin(((ny + 0.20) / 0.55) * Math.PI);
        z -= rearAero * 0.10 * (1.0 - Math.min(1.0, (nx * nx) * 1.2));
      }
    }
    pos.setXYZ(i, x * 1.20, y * 1.20, z * 1.20);
  }
  geom.computeVertexNormals();
  return geom;
}

const shell = createTestHelmetShell();
shell.computeBoundingBox();
const box = shell.boundingBox;
const lengthZ = box.max.z - box.min.z;
const widthX = box.max.x - box.min.x;

assert('3D Engine', shell.attributes.position.count === 3185, '2.3: Cranial shell has dense mesh resolution (3185 vertices)');
assert('3D Engine', lengthZ > widthX, `2.4: Helmet shell is aerodynamically elongated front-to-back (Z: ${lengthZ.toFixed(2)}m > X: ${widthX.toFixed(2)}m)`);
assert('3D Engine', box.max.z > 1.25, `2.5: Chin and visor forward protrusion exceeds nominal radius (${box.max.z.toFixed(2)}m > 1.20m)`);
assert('3D Engine', !isNaN(shell.attributes.normal.getX(0)), '2.6: Shell vertex normals are fully computed without NaN artifacts');
shell.dispose();

// Test Visor Geometry Orientation & Symmetrical Coverage
function createImplementedVisor() {
  const thetaLength = 2.20; // ~126 degree arc
  const thetaStart = Math.PI * 0.5 - thetaLength * 0.5;
  const geom = new THREE.CylinderGeometry(1.22, 1.25, 0.52, 48, 12, true, thetaStart, thetaLength);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let vx = pos.getX(i);
    let vy = pos.getY(i);
    let vz = pos.getZ(i);
    const vNorm = vy / 0.26;
    const bulge = Math.max(0, 1.0 - vNorm * vNorm) * 0.05;
    vz += bulge;
    const centerNorm = Math.max(0, 1.0 - (vx * vx) / 1.0);
    vz += centerNorm * 0.04;
    pos.setXYZ(i, vx, vy, vz);
  }
  geom.computeVertexNormals();
  return geom;
}
const visor = createImplementedVisor();
visor.computeBoundingBox();

// Check if visor geometry covers x=0 (the front center of the helmet face)
let minVisorX = Infinity;
let maxVisorX = -Infinity;
for (let i = 0; i < visor.attributes.position.count; i++) {
  const x = visor.attributes.position.getX(i);
  if (x < minVisorX) minVisorX = x;
  if (x > maxVisorX) maxVisorX = x;
}

const visorCoversCenter = minVisorX <= 0 && maxVisorX >= 0;
assert('3D Geometry Bug', visorCoversCenter, `2.7: Visor geometry must span across center line X=0 (actual minX: ${minVisorX.toFixed(3)}, maxX: ${maxVisorX.toFixed(3)}) — FAIL demonstrates 90° azimuth rotation bug`);
visor.dispose();

// Test Rear Spoiler Geometry Orientation
function createImplementedSpoiler() {
  const thetaLength = 1.80;
  const thetaStart = -Math.PI * 0.5 - thetaLength * 0.5;
  const geom = new THREE.CylinderGeometry(1.24, 1.34, 0.18, 36, 4, true, thetaStart, thetaLength);
  geom.rotateX(0.15);
  return geom;
}
const spoiler = createImplementedSpoiler();
let minSpoilerX = Infinity;
let maxSpoilerX = -Infinity;
for (let i = 0; i < spoiler.attributes.position.count; i++) {
  const x = spoiler.attributes.position.getX(i);
  if (x < minSpoilerX) minSpoilerX = x;
  if (x > maxSpoilerX) maxSpoilerX = x;
}
const spoilerCoversCenter = minSpoilerX <= 0 && maxSpoilerX >= 0;
assert('3D Geometry Bug', spoilerCoversCenter, `2.8: Rear spoiler geometry must span across center line X=0 (actual minX: ${minSpoilerX.toFixed(3)}, maxX: ${maxSpoilerX.toFixed(3)}) — FAIL demonstrates 90° azimuth rotation bug`);
spoiler.dispose();

// Test Lerp reveal formula edge points and gradient
function calcOpacities(revealFactor) {
  const clampedFactor = Math.max(0.0, Math.min(1.0, revealFactor));
  const shellOpacity = 1.0 - clampedFactor * 0.92;
  const visorOpacity = 1.0 - clampedFactor * 0.92;
  const faceOpacity = clampedFactor;
  const depthWrite = shellOpacity >= 0.98;
  return { shellOpacity, visorOpacity, faceOpacity, depthWrite };
}

const atZero = calcOpacities(0.0);
assert('Lerp Math', atZero.shellOpacity === 1.0, '2.9: Default state (factor=0.0) gives shell opacity exactly 1.0');
assert('Lerp Math', atZero.visorOpacity === 1.0, '2.10: Default state (factor=0.0) gives visor opacity exactly 1.0');
assert('Lerp Math', atZero.faceOpacity === 0.0, '2.11: Default state (factor=0.0) gives face opacity exactly 0.0');
assert('Lerp Math', atZero.depthWrite === true, '2.12: Default state enables depthWrite for closed opaque helmet');

const atHalf = calcOpacities(0.5);
assert('Lerp Math', Math.abs(atHalf.shellOpacity - 0.54) < 1e-4, '2.13: Mid-reveal (factor=0.5) gives shell opacity 0.54');
assert('Lerp Math', Math.abs(atHalf.faceOpacity - 0.50) < 1e-4, '2.14: Mid-reveal (factor=0.5) gives face opacity 0.50');
assert('Lerp Math', atHalf.depthWrite === false, '2.15: Mid-reveal disables depthWrite to prevent translucent sorting clipping');

const atFull = calcOpacities(1.0);
assert('Lerp Math', Math.abs(atFull.shellOpacity - 0.08) < 1e-4, '2.16: Full reveal (factor=1.0) dissolves shell to 0.08');
assert('Lerp Math', Math.abs(atFull.faceOpacity - 1.0) < 1e-4, '2.17: Full reveal (factor=1.0) brings face to 1.0');
assert('Lerp Math', atFull.depthWrite === false, '2.18: Full reveal disables depthWrite');

// Clamping boundary tests
assert('Lerp Math', calcOpacities(-0.5).shellOpacity === 1.0, '2.19: Negative revealFactor is strictly clamped to 0.0');
assert('Lerp Math', Math.abs(calcOpacities(1.5).shellOpacity - 0.08) < 1e-4, '2.20: Overshooting revealFactor is strictly clamped to 1.0');

// -----------------------------------------------------------------------------
// 3. Lifecycle Resource Disposal, Deep Traversal & Memory Leak Stress
// -----------------------------------------------------------------------------
console.log('\n>>> 3. Lifecycle Resource Disposal & Memory Leak Stress (50 Cycles)');

function createMockHelmetScene() {
  const scene = new THREE.Scene();
  const disposalCounts = {
    geometries: 0,
    materials: 0,
    textures: 0,
    renderer: 0,
    forceContextLoss: 0,
    rafCancelled: 0,
    listenersRemoved: 0
  };

  const makeGeoSpy = (geo) => {
    const origDispose = geo.dispose.bind(geo);
    geo.dispose = () => {
      disposalCounts.geometries++;
      origDispose();
    };
    return geo;
  };

  const makeMatSpy = (mat) => {
    const origDispose = mat.dispose.bind(mat);
    mat.dispose = () => {
      disposalCounts.materials++;
      origDispose();
    };
    return mat;
  };

  const makeTexSpy = (tex) => {
    const origDispose = tex.dispose.bind(tex);
    tex.dispose = () => {
      disposalCounts.textures++;
      origDispose();
    };
    return tex;
  };

  const shellGeo = makeGeoSpy(new THREE.SphereGeometry(1.2, 8, 8));
  const visorGeo = makeGeoSpy(new THREE.CylinderGeometry(1.2, 1.2, 0.5, 8));
  const bannerGeo = makeGeoSpy(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 8));
  const spoilerGeo = makeGeoSpy(new THREE.CylinderGeometry(1.2, 1.3, 0.18, 8));
  const ventGeo = makeGeoSpy(new THREE.BoxGeometry(0.28, 0.08, 0.06));
  const podGeo = makeGeoSpy(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8));
  const faceGeo = makeGeoSpy(new THREE.PlaneGeometry(1.5, 1.5));

  const liveryTex = makeTexSpy(new THREE.Texture());
  const portraitTex = makeTexSpy(new THREE.Texture());

  const shellMat = makeMatSpy(new THREE.MeshStandardMaterial({ map: liveryTex }));
  const visorMat = makeMatSpy(new THREE.MeshPhysicalMaterial());
  const bannerMat = makeMatSpy(new THREE.MeshStandardMaterial());
  const spoilerMat = makeMatSpy(new THREE.MeshStandardMaterial());
  const ventMat = makeMatSpy(new THREE.MeshStandardMaterial());
  const podMat = makeMatSpy(new THREE.MeshStandardMaterial());
  const faceMat = makeMatSpy(new THREE.MeshBasicMaterial({ map: portraitTex }));

  scene.add(new THREE.Mesh(shellGeo, shellMat));
  scene.add(new THREE.Mesh(visorGeo, visorMat));
  scene.add(new THREE.Mesh(bannerGeo, bannerMat));
  scene.add(new THREE.Mesh(spoilerGeo, spoilerMat));
  scene.add(new THREE.Mesh(ventGeo, ventMat));
  scene.add(new THREE.Mesh(podGeo, podMat));
  scene.add(new THREE.Mesh(faceGeo, faceMat));

  const mockRenderer = {
    dispose: () => { disposalCounts.renderer++; },
    forceContextLoss: () => { disposalCounts.forceContextLoss++; }
  };

  const performUnmount = () => {
    scene.traverse((object) => {
      if (!object) return;
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((mat) => {
          if (!mat) return;
          const textureKeys = [
            'map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap',
            'emissiveMap', 'envMap', 'lightMap', 'metalnessMap',
            'normalMap', 'roughnessMap', 'clearcoatMap', 'clearcoatNormalMap',
            'clearcoatRoughnessMap', 'transmissionMap', 'thicknessMap'
          ];
          textureKeys.forEach((key) => {
            const tex = mat[key];
            if (tex && typeof tex.dispose === 'function') {
              tex.dispose();
            }
          });
          mat.dispose();
        });
      }
    });

    if (portraitTex && typeof portraitTex.dispose === 'function') {
      portraitTex.dispose();
    }
    if (liveryTex && typeof liveryTex.dispose === 'function') {
      liveryTex.dispose();
    }
    if (mockRenderer) {
      mockRenderer.dispose();
      if (typeof mockRenderer.forceContextLoss === 'function') {
        mockRenderer.forceContextLoss();
      }
    }
    scene.clear();
  };

  return { scene, disposalCounts, performUnmount };
}

const singleRun = createMockHelmetScene();
singleRun.performUnmount();

assert('Lifecycle & Disposal', singleRun.disposalCounts.geometries === 7, `3.1: All 7 meshes have their geometry disposed (actual: ${singleRun.disposalCounts.geometries})`);
assert('Lifecycle & Disposal', singleRun.disposalCounts.materials === 7, `3.2: All 7 materials disposed (actual: ${singleRun.disposalCounts.materials})`);
assert('Lifecycle & Disposal', singleRun.disposalCounts.textures >= 2, `3.3: Textures disposed on unmount (actual: ${singleRun.disposalCounts.textures})`);
assert('Lifecycle & Disposal', singleRun.disposalCounts.renderer === 1, '3.4: WebGLRenderer.dispose() called');
assert('Lifecycle & Disposal', singleRun.disposalCounts.forceContextLoss === 1, '3.5: WebGLRenderer.forceContextLoss() called to release WebGL context');
assert('Lifecycle & Disposal', singleRun.scene.children.length === 0, '3.6: scene.clear() executed, freeing scene graph');

// Stress Test: 50 consecutive mount & unmount cycles
let totalGeos = 0;
let totalMats = 0;
let stressPassed = true;

for (let cycle = 0; cycle < 50; cycle++) {
  try {
    const s = createMockHelmetScene();
    s.performUnmount();
    totalGeos += s.disposalCounts.geometries;
    totalMats += s.disposalCounts.materials;
  } catch (err) {
    stressPassed = false;
    console.error(`Disposal stress failed at cycle ${cycle}:`, err);
    break;
  }
}

assert('Lifecycle & Disposal', stressPassed, '3.7: 50 rapid mount/unmount cycles completed without throwing exceptions');
assert('Lifecycle & Disposal', totalGeos === 50 * 7, `3.8: Exactly 350/350 geometries disposed across 50 cycles (${totalGeos})`);
assert('Lifecycle & Disposal', totalMats === 50 * 7, `3.9: Exactly 350/350 materials disposed across 50 cycles (${totalMats})`);

// -----------------------------------------------------------------------------
// 4. Mobile Touch Gesture Differentiation & Touch-Action CSS
// -----------------------------------------------------------------------------
console.log('\n>>> 4. Mobile Touch Gesture Differentiation & Touch-Action CSS');

class TouchInteractionEmulator {
  constructor(containerRect = { left: 0, top: 0, width: 600, height: 400 }) {
    this.rect = containerRect;
    this.interactive = true;
    this.enableParallax = true;
    this.isHovered = false;
    this.targetNormX = 0;
    this.targetNormY = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.touchMoved = false;
  }

  touchStart(clientX, clientY, timestamp) {
    this.touchStartX = clientX;
    this.touchStartY = clientY;
    this.touchStartTime = timestamp;
    this.touchMoved = false;
  }

  touchMove(clientX, clientY) {
    if (!this.interactive || !this.enableParallax) return;
    const dx = clientX - this.touchStartX;
    const dy = clientY - this.touchStartY;
    if (Math.hypot(dx, dy) > 10) {
      this.touchMoved = true;
      const nx = ((clientX - this.rect.left) / this.rect.width) * 2.0 - 1.0;
      const ny = ((clientY - this.rect.top) / this.rect.height) * 2.0 - 1.0;
      this.targetNormX = Math.max(-1.0, Math.min(1.0, nx));
      this.targetNormY = Math.max(-1.0, Math.min(1.0, ny));
    }
  }

  touchEnd(timestamp) {
    if (!this.interactive) return;
    const duration = timestamp - this.touchStartTime;
    if (!this.touchMoved && duration < 350) {
      this.isHovered = !this.isHovered;
    }
    this.targetNormX = 0;
    this.targetNormY = 0;
  }

  touchCancel() {
    this.targetNormX = 0;
    this.targetNormY = 0;
  }
}

const touchSim = new TouchInteractionEmulator();
assert('Touch Gestures', touchSim.isHovered === false, '4.1: Initial touch state isHovered is false');

// First tap
touchSim.touchStart(300, 200, 1000);
touchSim.touchMove(302, 201); // 2.2px movement (<10px threshold)
touchSim.touchEnd(1120); // 120ms duration (<350ms threshold)
assert('Touch Gestures', touchSim.isHovered === true, '4.2: Clean tap (120ms, 2px delta) toggles isHovered to true (reveal face)');

// Second tap
touchSim.touchStart(300, 200, 1500);
touchSim.touchEnd(1650); // 150ms duration
assert('Touch Gestures', touchSim.isHovered === false, '4.3: Second clean tap toggles isHovered back to false (restore helmet)');

// Drag / Swipe Gesture
touchSim.touchStart(300, 200, 2000);
touchSim.touchMove(450, 280); // dx=150, dy=80, hypot=170px (>10px threshold)
assert('Touch Gestures', touchSim.touchMoved === true, '4.4: Touch drag exceeding 10px flags touchMoved = true');
assert('Touch Gestures', touchSim.targetNormX > 0.4, '4.5: Touch drag computes proportional targetNormX for yaw parallax');
touchSim.touchEnd(2200); // 200ms
assert('Touch Gestures', touchSim.isHovered === false, '4.6: Drag release does NOT toggle isHovered (retains closed state)');
assert('Touch Gestures', touchSim.targetNormX === 0 && touchSim.targetNormY === 0, '4.7: Touch release restores targetNorm coordinates to 0,0');

// Long Press Gesture
touchSim.touchStart(300, 200, 3000);
touchSim.touchMove(301, 201);
touchSim.touchEnd(3500); // 500ms duration (>= 350ms threshold)
assert('Touch Gestures', touchSim.isHovered === false, '4.8: Long press (500ms duration) does NOT trigger false tap toggle');

// Touch Cancel
touchSim.touchStart(300, 200, 4000);
touchSim.touchMove(400, 250);
touchSim.touchCancel();
assert('Touch Gestures', touchSim.targetNormX === 0 && touchSim.targetNormY === 0, '4.9: touchcancel resets targetNorm coordinates immediately');

// Inspect Helmet3D.css for touch-action: pan-y
const cssPath = path.join(rootDir, 'src', 'components', 'Helmet3D.css');
assert('Touch Action', fs.existsSync(cssPath), '4.10: Helmet3D.css exists on disk');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert('Touch Action', cssContent.includes('.helmet-3d-container') && cssContent.includes('touch-action: pan-y'), '4.11: .helmet-3d-container explicitly sets touch-action: pan-y (prevents scroll hijacking)');
assert('Touch Action', cssContent.includes('.helmet-fallback-wrapper') && cssContent.includes('touch-action: pan-y'), '4.12: .helmet-fallback-wrapper sets touch-action: pan-y');
assert('Touch Action', cssContent.includes('user-select: none'), '4.13: user-select: none is set to prevent accidental text highlighting on drag');

// -----------------------------------------------------------------------------
// 5. WebGL Failure Fallback Delegation & HelmetFallback Card
// -----------------------------------------------------------------------------
console.log('\n>>> 5. WebGL Failure Fallback Delegation & HelmetFallback Card');

const fallbackBundle = await build({
  configFile: false,
  plugins: [react()],
  build: {
    write: false,
    lib: {
      entry: './src/components/HelmetFallback.jsx',
      formats: ['es']
    },
    rollupOptions: {
      external: ['react', 'react-dom']
    }
  }
});
const fallbackCode = fallbackBundle[0].output.find(c => c.fileName.endsWith('.js') || c.fileName.endsWith('.mjs'))?.code;
assert('Fallback Card', !!fallbackCode && fallbackCode.length > 2000, '5.1: HelmetFallback.jsx compiles into production bundle');

const fallbackSrc = fs.readFileSync(path.join(rootDir, 'src', 'components', 'HelmetFallback.jsx'), 'utf8');
assert('Fallback Card', fallbackSrc.includes('aspectRatio: \'3 / 2\'') || fallbackSrc.includes('3 / 2'), '5.2: Fallback card enforces aspect-ratio: 3 / 2 to prevent CLS');
assert('Fallback Card', fallbackSrc.includes('KIMI_IMAGES.cockpitHelmet'), '5.3: Fallback layer 1 references authentic KIMI_IMAGES.cockpitHelmet');
assert('Fallback Card', fallbackSrc.includes('KIMI_IMAGES.portraitOfficial'), '5.4: Fallback layer 2 references authentic KIMI_IMAGES.portraitOfficial');
assert('Fallback Card', fallbackSrc.includes('TELEMETRY // VISOR CLOSED'), '5.5: Fallback defines default status "TELEMETRY // VISOR CLOSED"');
assert('Fallback Card', fallbackSrc.includes('REVEAL // DRIVER FOCUS'), '5.6: Fallback defines reveal status "REVEAL // DRIVER FOCUS"');
assert('Fallback Card', fallbackSrc.includes('CAR') && fallbackSrc.includes('#12'), '5.7: Fallback displays CAR #12 driver badge');
assert('Fallback Card', fallbackSrc.includes('role="region"'), '5.8: Fallback defines role="region" for accessibility');
assert('Fallback Card', fallbackSrc.includes('aria-label'), '5.9: Fallback defines accessible aria-label');
assert('Fallback Card', fallbackSrc.includes('aria-expanded={isRevealed}'), '5.10: Fallback synchronizes aria-expanded state');
assert('Fallback Card', fallbackSrc.includes('prefers-reduced-motion: reduce'), '5.11: Fallback checks prefers-reduced-motion media query');
assert('Fallback Card', fallbackSrc.includes('e.key === \'Enter\' || e.key === \' \''), '5.12: Fallback supports Enter and Space keyboard toggle');

// Check Helmet3D fallback delegation logic
const helmet3dSrc = fs.readFileSync(path.join(rootDir, 'src', 'components', 'Helmet3D.jsx'), 'utf8');
assert('Fallback Delegation', helmet3dSrc.includes('if (!isSupported || isContextLost)'), '5.13: Helmet3D conditionally branches on !isSupported || isContextLost');
assert('Fallback Delegation', helmet3dSrc.includes('<HelmetFallback'), '5.14: Helmet3D renders HelmetFallback when WebGL is unavailable');
assert('Fallback Delegation', helmet3dSrc.includes('return fallback ||'), '5.15: Helmet3D supports custom fallback override prop');

// -----------------------------------------------------------------------------
// 6. Production Build Verification & Clean Asset Output
// -----------------------------------------------------------------------------
console.log('\n>>> 6. Production Build Verification (npm run build)');

let buildSuccess = false;
let buildStdout = '';
try {
  buildStdout = execSync('npm run build', {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  buildSuccess = true;
} catch (err) {
  buildStdout = err.stdout + '\n' + err.stderr;
  buildSuccess = false;
}

assert('Production Build', buildSuccess, '6.1: npm run build exits with code 0', buildStdout.slice(-300));

const distDir = path.join(rootDir, 'dist');
assert('Production Build', fs.existsSync(distDir), '6.2: dist/ directory was generated');
assert('Production Build', fs.existsSync(path.join(distDir, 'index.html')), '6.3: dist/index.html exists');

const distAssets = fs.existsSync(path.join(distDir, 'assets')) ? fs.readdirSync(path.join(distDir, 'assets')) : [];
const hasJsChunk = distAssets.some(f => f.endsWith('.js'));
const hasCssChunk = distAssets.some(f => f.endsWith('.css'));
assert('Production Build', hasJsChunk, '6.4: dist/assets/ contains bundled JavaScript chunks');
assert('Production Build', hasCssChunk, '6.5: dist/assets/ contains bundled CSS stylesheet');

let distHasRemoteUrls = false;
for (const file of distAssets) {
  if (file.endsWith('.js') || file.endsWith('.css')) {
    const content = fs.readFileSync(path.join(distDir, 'assets', file), 'utf8');
    if (content.includes('http://') || (content.includes('https://') && !content.includes('fonts.googleapis.com') && !content.includes('fonts.gstatic.com'))) {
      if (/https?:\/\/[^"'\s]+\.(?:png|jpg|jpeg|webp)/i.test(content)) {
        distHasRemoteUrls = true;
        break;
      }
    }
  }
}
assert('Production Build', !distHasRemoteUrls, '6.6: Production bundle has zero external image CDN URLs (all authentic local assets)');

// =============================================================================
// SUMMARY REPORT
// =============================================================================
console.log('\n========================================================================');
console.log('                          TEST EXECUTION SUMMARY                        ');
console.log('========================================================================');
for (const [cat, stats] of Object.entries(suite.categories)) {
  const status = stats.failed === 0 ? 'PASSED' : 'FAILED';
  console.log(`  ${cat.padEnd(25)}: ${status} | Passed: ${String(stats.passed).padStart(2)} | Failed: ${String(stats.failed).padStart(2)} | Total: ${String(stats.total).padStart(2)}`);
}
console.log('------------------------------------------------------------------------');
console.log(`  OVERALL: ${suite.failed === 0 ? 'ALL PASSED' : 'FAILURES DETECTED'}`);
console.log(`  Total: ${suite.total} | Passed: ${suite.passed} | Failed: ${suite.failed}`);
console.log('========================================================================\n');

if (suite.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
