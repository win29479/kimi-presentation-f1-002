/**
 * Helmet3D.jsx
 * Interactive Three.js 3D Racing Helmet Centerpiece with Procedural Livery,
 * Visor Iridescence, Kinetic Parallax, Exponential Lerp Face Reveal,
 * and WebGL Resilience Fallback.
 */
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { KIMI_IMAGES } from '../assets/images';
import { useWebGLSupport } from '../hooks/useWebGLSupport';
import HelmetFallback from './HelmetFallback';
import './Helmet3D.css';

/**
 * 1. Procedural Aerodynamic Cranial Shell Geometry
 */
function createHelmetShellGeometry() {
  const geom = new THREE.SphereGeometry(1.20, 64, 48);
  const pos = geom.attributes.position;
  const count = pos.count;

  for (let i = 0; i < count; i++) {
    const x0 = pos.getX(i);
    const y0 = pos.getY(i);
    const z0 = pos.getZ(i);

    // Normalize coordinates
    const nx = x0 / 1.20;
    const ny = y0 / 1.20;
    const nz = z0 / 1.20;

    // 1. Proportions: F1 helmets are elongated front-to-back, slightly tapered at temples
    let x = nx * 0.94;
    let y = ny * 1.05;
    let z = nz * 1.08;

    // 2. Base Neck opening & collar:
    if (ny < -0.60) {
      const neckProgress = (-ny - 0.60) / 0.40;
      y = -0.60 * 1.05 - neckProgress * 0.08;
      const neckFlare = 1.0 + neckProgress * 0.12;
      x *= neckFlare;
      z *= neckFlare;
    }

    // 3. Front Facial & Visor Region (nz > 0)
    if (nz > 0) {
      // 3a. Forehead / Brow Ridge
      if (ny > 0.18 && ny < 0.52) {
        const browEnvelope = Math.sin(((ny - 0.18) / 0.34) * Math.PI);
        const lateralFalloff = Math.max(0.0, 1.0 - (nx * nx) * 1.5);
        z += browEnvelope * lateralFalloff * 0.14;
      }

      // 3b. Eyeport Recess (steps inward for visor seating)
      if (ny >= -0.10 && ny <= 0.28) {
        const eyeEnvelope = Math.cos(((ny - 0.09) / 0.19) * (Math.PI * 0.5));
        const lateralFalloff = Math.max(0.0, 1.0 - Math.pow(nx / 0.75, 4.0));
        z -= eyeEnvelope * lateralFalloff * 0.08;
      }

      // 3c. Chin Bar & Aerodynamic Chisel
      if (ny < 0.0 && ny > -0.60) {
        const chinProgress = (-ny) / 0.60;
        const chinPunch = Math.sin(chinProgress * Math.PI * 0.85) * 0.26;
        const lateralFalloff = Math.max(0.0, 1.0 - Math.abs(nx) * 0.85);
        z += chinPunch * lateralFalloff;
        x *= (1.0 - chinProgress * 0.14);
      }
    } else {
      // 4. Rear Aerodynamic Contouring (nz <= 0)
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

/**
 * 2. Procedural Curved Polycarbonate Visor Geometry
 */
function createVisorGeometry() {
  const thetaLength = 2.20; // ~126 degree arc
  const thetaStart = Math.PI * 0.5 - thetaLength * 0.5;
  const geom = new THREE.CylinderGeometry(1.22, 1.25, 0.52, 48, 12, true, thetaStart, thetaLength);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let vx = pos.getX(i);
    let vy = pos.getY(i);
    let vz = pos.getZ(i);

    // Vertical bulge: compound curvature
    const vNorm = vy / 0.26;
    const bulge = Math.max(0, 1.0 - vNorm * vNorm) * 0.05;
    vz += bulge;

    // Aerodynamic forward sweep at center
    const centerNorm = Math.max(0, 1.0 - (vx * vx) / 1.0);
    vz += centerNorm * 0.04;

    pos.setXYZ(i, vx, vy, vz);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * 3. Procedural Upper Sunstrip Banner Geometry
 */
function createVisorBannerGeometry() {
  const thetaLength = 2.22;
  const thetaStart = Math.PI * 0.5 - thetaLength * 0.5;
  return new THREE.CylinderGeometry(1.23, 1.235, 0.11, 48, 2, true, thetaStart, thetaLength);
}

/**
 * 4. Procedural Aero Diffuser, Intake Vent & Pivot Geometry
 */
function createRearSpoilerGeometry() {
  const thetaLength = 1.80;
  const thetaStart = -Math.PI * 0.5 - thetaLength * 0.5;
  const geom = new THREE.CylinderGeometry(1.24, 1.34, 0.18, 36, 4, true, thetaStart, thetaLength);
  geom.rotateX(0.15);
  return geom;
}

function createChinVentGeometry() {
  return new THREE.BoxGeometry(0.28, 0.08, 0.06);
}

function createPivotPodGeometry() {
  return new THREE.CylinderGeometry(0.08, 0.08, 0.04, 24);
}

/**
 * 5. Procedural Helmet Livery Canvas Texture Generator
 */
function createHelmetLiveryTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // 1. Dark titanium carbon background
  ctx.fillStyle = '#10141d';
  ctx.fillRect(0, 0, size, size);

  // 2. Carbon weave pattern
  ctx.fillStyle = '#161c28';
  for (let y = 0; y < size; y += 8) {
    for (let x = 0; x < size; x += 8) {
      if ((x + y) % 16 === 0) {
        ctx.fillRect(x, y, 8, 8);
      }
    }
  }

  // 3. Central racing stripe (Mercedes Speed Silver + Petronas Cyan)
  const cx = size / 2;
  ctx.fillStyle = '#b6c1c8';
  ctx.fillRect(cx - 70, 0, 140, size);

  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(cx - 50, 0, 100, size);

  ctx.fillStyle = '#00d2be';
  ctx.fillRect(cx - 40, 0, 24, size);
  ctx.fillRect(cx + 16, 0, 24, size);

  // 4. Driver Number #12 badge on crown and sides
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px "Oswald", "Impact", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('12', cx, size * 0.28);

  ctx.fillStyle = '#00d2be';
  ctx.font = 'bold 24px "Space Grotesk", monospace';
  ctx.fillText('ANTONELLI', cx, size * 0.35);

  // 5. Side aero wing ribbons (flowing teal lines on left and right)
  ctx.strokeStyle = '#00d2be';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(size * 0.1, size * 0.5);
  ctx.bezierCurveTo(size * 0.2, size * 0.6, size * 0.35, size * 0.7, size * 0.45, size * 0.85);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size * 0.9, size * 0.5);
  ctx.bezierCurveTo(size * 0.8, size * 0.6, size * 0.65, size * 0.7, size * 0.55, size * 0.85);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;

  return tex;
}

export default function Helmet3D({
  className = '',
  onRevealChange,
  fallback,
  interactive = true,
  enableParallax = true,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const { isSupported, isContextLost, handleContextLost, handleContextRestored } = useWebGLSupport(canvasRef);

  // Internal mutable state ref (zero React re-renders in 60fps loop)
  const stateRef = useRef({
    isHovered: false,
    revealFactor: 0.0,
    targetReveal: 0.0,

    // Parallax tracking
    targetNormX: 0.0,
    targetNormY: 0.0,
    currentNormX: 0.0,
    currentNormY: 0.0,
    currentRotX: 0.0,
    currentRotY: 0.0,
    currentRotZ: 0.0,
    currentPosX: 0.0,
    currentPosY: 0.0,

    // Runtime state flags
    prefersReducedMotion: false,
    isInViewport: true,
    isTabActive: true,
    rafId: null,
    lastTime: performance.now(),

    // Touch interaction
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    touchMoved: false,
  });

  useEffect(() => {
    if (!isSupported || isContextLost) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let isDisposed = false;

    // 1. Accessibility prefers-reduced-motion check
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    stateRef.current.prefersReducedMotion = motionQuery.matches;
    const onMotionChange = (e) => {
      stateRef.current.prefersReducedMotion = e.matches;
    };
    motionQuery.addEventListener('change', onMotionChange);

    // 2. Setup Three.js Scene, Camera, Renderer
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 4.0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } catch (err) {
      console.error('WebGLRenderer initialization failed:', err);
      handleContextLost();
      return;
    }

    // 3. Motorsport Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x0e121b, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3.5, 4.5, 3.5);
    scene.add(keyLight);

    const cyanRimLight = new THREE.DirectionalLight(0x00d2be, 3.2);
    cyanRimLight.position.set(-4.0, 2.5, -3.0);
    scene.add(cyanRimLight);

    const cyanKicker = new THREE.DirectionalLight(0x00a19b, 1.5);
    cyanKicker.position.set(3.0, -2.0, -2.5);
    scene.add(cyanKicker);

    const fillLight = new THREE.DirectionalLight(0x94a9b8, 0.9);
    fillLight.position.set(-3.0, 0.5, 3.0);
    scene.add(fillLight);

    const innerLight = new THREE.PointLight(0xffffff, 0.2, 5.0);
    innerLight.position.set(0, 0.05, 0.5);
    scene.add(innerLight);

    // 4. Object Hierarchy
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const pivotGroup = new THREE.Group();
    rootGroup.add(pivotGroup);

    // 4a. Inner Face Mesh (authentic Kimi portrait)
    const textureLoader = new THREE.TextureLoader();
    const portraitTexture = textureLoader.load(KIMI_IMAGES.portraitOfficial.src);
    portraitTexture.colorSpace = THREE.SRGBColorSpace;
    portraitTexture.generateMipmaps = true;

    const faceGeo = new THREE.PlaneGeometry(1.50, 1.50);
    const faceMaterial = new THREE.MeshBasicMaterial({
      map: portraitTexture,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const faceMesh = new THREE.Mesh(faceGeo, faceMaterial);
    faceMesh.position.set(0, 0.04, 0.12);
    faceMesh.renderOrder = 0; // Rendered first inside helmet
    pivotGroup.add(faceMesh);

    // 4b. Procedural Shell & Materials
    const liveryTexture = createHelmetLiveryTexture();

    const shellGeo = createHelmetShellGeometry();
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: liveryTexture,
      roughness: 0.35,
      metalness: 0.45,
      transparent: true,
      opacity: 1.0,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMaterial);
    shellMesh.renderOrder = 1;
    pivotGroup.add(shellMesh);

    // 4c. Curved Polycarbonate Visor
    const visorGeo = createVisorGeometry();
    const visorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00423c,
      metalness: 0.90,
      roughness: 0.10,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 0.85,
      iridescenceIOR: 1.33,
      iridescenceThicknessRange: [120, 380],
      transparent: true,
      opacity: 1.0,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMaterial);
    visorMesh.position.set(0, 0.08, 0.02);
    visorMesh.renderOrder = 2;
    pivotGroup.add(visorMesh);

    // 4d. Visor Sunstrip Banner
    const bannerGeo = createVisorBannerGeometry();
    const bannerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0d14,
      roughness: 0.40,
      metalness: 0.60,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMaterial);
    bannerMesh.position.set(0, 0.28, 0.025);
    bannerMesh.renderOrder = 2;
    pivotGroup.add(bannerMesh);

    // 4e. Side Visor Pivot Pods
    const podGeo = createPivotPodGeometry();
    const podMaterial = new THREE.MeshStandardMaterial({
      color: 0x00d2be,
      roughness: 0.20,
      metalness: 0.90,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    const podLeft = new THREE.Mesh(podGeo, podMaterial);
    podLeft.position.set(-1.12, 0.14, 0.22);
    podLeft.rotation.z = Math.PI / 2;
    podLeft.renderOrder = 2;
    pivotGroup.add(podLeft);

    const podRight = new THREE.Mesh(podGeo, podMaterial);
    podRight.position.set(1.12, 0.14, 0.22);
    podRight.rotation.z = Math.PI / 2;
    podRight.renderOrder = 2;
    pivotGroup.add(podRight);

    // 4f. Rear Aero Spoiler & Chin Vent
    const spoilerGeo = createRearSpoilerGeometry();
    const spoilerMaterial = new THREE.MeshStandardMaterial({
      color: 0x00d2be,
      roughness: 0.30,
      metalness: 0.70,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const spoilerMesh = new THREE.Mesh(spoilerGeo, spoilerMaterial);
    spoilerMesh.position.set(0, 0.55, -0.15);
    spoilerMesh.renderOrder = 1;
    pivotGroup.add(spoilerMesh);

    const ventGeo = createChinVentGeometry();
    const ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x06080c,
      roughness: 0.60,
      metalness: 0.50,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    const ventMesh = new THREE.Mesh(ventGeo, ventMaterial);
    ventMesh.position.set(0, -0.42, 1.14);
    ventMesh.renderOrder = 1;
    pivotGroup.add(ventMesh);

    // 5. DETERMINISTIC 60FPS ANIMATION LOOP
    const animate = (currentTime) => {
      if (isDisposed) return;

      const state = stateRef.current;
      if (!renderer || !state.isInViewport || !state.isTabActive) {
        state.rafId = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min(Math.max((currentTime - state.lastTime) / 1000, 0.001), 0.1);
      state.lastTime = currentTime;

      // 5.1 Hover Reveal Lerp Step
      state.targetReveal = state.isHovered ? 1.0 : 0.0;
      const effectiveLerpSpeed = state.prefersReducedMotion ? 1.0 : 0.08;
      const lerpStep = 1.0 - Math.pow(1.0 - effectiveLerpSpeed, dt * 60);
      state.revealFactor += (state.targetReveal - state.revealFactor) * lerpStep;

      // Threshold snapping & strict boundary clamping
      if (Math.abs(state.targetReveal - state.revealFactor) < 0.001) {
        state.revealFactor = state.targetReveal;
      }
      state.revealFactor = Math.max(0.0, Math.min(1.0, state.revealFactor));

      // 5.2 Opacity Modulation (Formula: 1.0 - factor * 0.92, dissolving to 0.08)
      const shellOpacity = 1.0 - state.revealFactor * 0.92;
      const visorOpacity = 1.0 - state.revealFactor * 0.92;
      const faceOpacity = state.revealFactor;

      shellMaterial.opacity = shellOpacity;
      visorMaterial.opacity = visorOpacity;
      bannerMaterial.opacity = shellOpacity;
      podMaterial.opacity = shellOpacity;
      spoilerMaterial.opacity = shellOpacity;
      ventMaterial.opacity = shellOpacity;
      faceMaterial.opacity = faceOpacity;

      // DepthWrite management to prevent transparency clipping/artifacts
      const writeDepth = shellOpacity >= 0.98;
      shellMaterial.depthWrite = writeDepth;
      visorMaterial.depthWrite = writeDepth;

      // Inner point light surge
      innerLight.intensity = 0.2 + state.revealFactor * 2.0;

      // Notify parent callback if provided
      if (onRevealChange) {
        onRevealChange(state.revealFactor);
      }

      // 5.3 Parallax Kinematics
      if (enableParallax && interactive) {
        const dampStep = 1.0 - Math.pow(1.0 - 0.08, dt * 60);
        state.currentNormX += (state.targetNormX - state.currentNormX) * dampStep;
        state.currentNormY += (state.targetNormY - state.currentNormY) * dampStep;

        const maxYaw = 15 * (Math.PI / 180);
        const maxPitch = 12 * (Math.PI / 180);
        const maxRoll = 3 * (Math.PI / 180);

        const targetRotY = state.currentNormX * maxYaw;
        const targetRotX = -state.currentNormY * maxPitch;
        const targetRotZ = -state.currentNormX * maxRoll;

        state.currentRotX += (targetRotX - state.currentRotX) * dampStep;
        state.currentRotY += (targetRotY - state.currentRotY) * dampStep;
        state.currentRotZ += (targetRotZ - state.currentRotZ) * dampStep;

        state.currentPosX += (state.currentNormX * 0.10 - state.currentPosX) * dampStep;
        state.currentPosY += (-state.currentNormY * 0.08 - state.currentPosY) * dampStep;
      }

      // 5.4 Ambient Floating Drift (Harmonic micro-oscillations)
      let driftPitch = 0, driftYaw = 0, driftRoll = 0, driftY = 0;
      if (!state.prefersReducedMotion) {
        const timeSec = currentTime * 0.001;
        const driftWeight = 1.0 - state.revealFactor; // Attenuates to zero on hover
        driftY = Math.sin(timeSec * 1.3) * 0.035 * driftWeight;
        driftPitch = Math.sin(timeSec * 1.1) * 0.025 * driftWeight;
        driftYaw = Math.cos(timeSec * 0.85) * 0.030 * driftWeight;
        driftRoll = Math.sin(timeSec * 0.70 + 1.2) * 0.012 * driftWeight;
      }

      // Apply transformations to scene hierarchy
      pivotGroup.rotation.set(
        state.currentRotX + driftPitch,
        state.currentRotY + driftYaw,
        state.currentRotZ + driftRoll
      );
      pivotGroup.position.set(
        state.currentPosX,
        state.currentPosY + driftY,
        0
      );

      // Differential face volume parallax
      faceMesh.position.x = state.currentNormX * 0.04;
      faceMesh.position.y = 0.04 - state.currentNormY * 0.03;

      renderer.render(scene, camera);
      state.rafId = requestAnimationFrame(animate);
    };

    stateRef.current.lastTime = performance.now();
    stateRef.current.rafId = requestAnimationFrame(animate);

    // 6. DOM EVENT LISTENERS
    // 6.1 Desktop Pointer
    const handlePointerEnter = () => {
      if (!interactive) return;
      stateRef.current.isHovered = true;
    };

    const handlePointerLeave = () => {
      if (!interactive) return;
      stateRef.current.isHovered = false;
      stateRef.current.targetNormX = 0;
      stateRef.current.targetNormY = 0;
    };

    const handlePointerMove = (e) => {
      if (!interactive || !enableParallax) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
      const ny = ((e.clientY - rect.top) / rect.height) * 2.0 - 1.0;
      stateRef.current.targetNormX = Math.max(-1.0, Math.min(1.0, nx));
      stateRef.current.targetNormY = Math.max(-1.0, Math.min(1.0, ny));
    };

    // 6.2 Mobile Touch (Tap Toggle vs Drag Parallax)
    const handleTouchStart = (e) => {
      if (!interactive || !e.touches[0]) return;
      const t = e.touches[0];
      stateRef.current.touchStartX = t.clientX;
      stateRef.current.touchStartY = t.clientY;
      stateRef.current.touchStartTime = performance.now();
      stateRef.current.touchMoved = false;
    };

    const handleTouchMove = (e) => {
      if (!interactive || !enableParallax || !e.touches[0]) return;
      const t = e.touches[0];
      const dx = t.clientX - stateRef.current.touchStartX;
      const dy = t.clientY - stateRef.current.touchStartY;
      if (Math.hypot(dx, dy) > 10) {
        stateRef.current.touchMoved = true;
        const rect = container.getBoundingClientRect();
        const nx = ((t.clientX - rect.left) / rect.width) * 2.0 - 1.0;
        const ny = ((t.clientY - rect.top) / rect.height) * 2.0 - 1.0;
        stateRef.current.targetNormX = Math.max(-1.0, Math.min(1.0, nx));
        stateRef.current.targetNormY = Math.max(-1.0, Math.min(1.0, ny));
      }
    };

    const handleTouchEnd = () => {
      if (!interactive) return;
      const duration = performance.now() - stateRef.current.touchStartTime;
      if (!stateRef.current.touchMoved && duration < 350) {
        // Clean tap toggles hover reveal
        stateRef.current.isHovered = !stateRef.current.isHovered;
      }
      stateRef.current.targetNormX = 0;
      stateRef.current.targetNormY = 0;
    };

    const handleTouchCancel = () => {
      stateRef.current.targetNormX = 0;
      stateRef.current.targetNormY = 0;
    };

    // 6.3 Scroll Safety Handler (Reset hover when scrolling past hero section)
    const handleScroll = () => {
      if (window.scrollY >= 800 && stateRef.current.isHovered) {
        stateRef.current.isHovered = false;
        stateRef.current.targetNormX = 0;
        stateRef.current.targetNormY = 0;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 6.4 Intersection Observer (Pause & Reset when off-screen)
    const observer = new IntersectionObserver(
      ([entry]) => {
        stateRef.current.isInViewport = entry.isIntersecting;
        if (!entry.isIntersecting) {
          stateRef.current.isHovered = false;
          stateRef.current.targetNormX = 0;
          stateRef.current.targetNormY = 0;
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // 6.5 Tab Visibility
    const handleVisibilityChange = () => {
      stateRef.current.isTabActive = !document.hidden;
      if (!document.hidden) {
        stateRef.current.lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 6.6 Window Resize
    const handleResize = () => {
      if (isDisposed || !container || !renderer || !camera) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 6.7 Context Loss Listeners on Active Canvas
    const onCanvasContextLost = (e) => {
      e.preventDefault();
      handleContextLost(e);
      if (stateRef.current.rafId) {
        cancelAnimationFrame(stateRef.current.rafId);
        stateRef.current.rafId = null;
      }
    };

    const onCanvasContextRestored = () => {
      handleContextRestored();
    };

    canvas.addEventListener('webglcontextlost', onCanvasContextLost, false);
    canvas.addEventListener('webglcontextrestored', onCanvasContextRestored, false);

    // Attach container interaction listeners
    container.addEventListener('pointerenter', handlePointerEnter);
    container.addEventListener('pointerleave', handlePointerLeave);
    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchCancel);

    // 7. EXHAUSTIVE UNMOUNT DISPOSAL PROTOCOL
    return () => {
      isDisposed = true;

      // 7.1 Cancel active RAF immediately
      if (stateRef.current.rafId) {
        cancelAnimationFrame(stateRef.current.rafId);
        stateRef.current.rafId = null;
      }

      // 7.2 Remove event listeners
      motionQuery.removeEventListener('change', onMotionChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();

      canvas.removeEventListener('webglcontextlost', onCanvasContextLost);
      canvas.removeEventListener('webglcontextrestored', onCanvasContextRestored);

      container.removeEventListener('pointerenter', handlePointerEnter);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);

      // 7.3 Deep scene traversal to dispose all GPU buffers
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

      // 7.4 Dispose standalone textures
      if (portraitTexture && typeof portraitTexture.dispose === 'function') {
        portraitTexture.dispose();
      }
      if (liveryTexture && typeof liveryTexture.dispose === 'function') {
        liveryTexture.dispose();
      }

      // 7.5 Dispose renderer and force context loss
      if (renderer) {
        renderer.dispose();
        if (typeof renderer.forceContextLoss === 'function') {
          renderer.forceContextLoss();
        }
      }

      // 7.6 Clear scene graph
      scene.clear();
    };
  }, [isSupported, isContextLost, interactive, enableParallax, handleContextLost, handleContextRestored, onRevealChange]);

  // Render Fallback if WebGL is unavailable or context lost
  if (!isSupported || isContextLost) {
    return fallback || (
      <HelmetFallback
        className={className}
        onRevealChange={onRevealChange}
        interactive={interactive}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`helmet-3d-container ${className}`}
      tabIndex={interactive ? 0 : -1}
      role="region"
      aria-label="Kimi Antonelli 3D Interactive Racing Helmet Experience. Hover or tap to reveal driver portrait."
    >
      <canvas
        ref={canvasRef}
        className="helmet-3d-canvas"
      />
    </div>
  );
}
