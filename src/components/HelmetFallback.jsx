/**
 * HelmetFallback.jsx
 * 2.5D Interactive Fallback Card for non-WebGL environments, software renderers,
 * or lost GPU contexts. Features CSS 3D perspective, cursor tilt, smooth cross-fade
 * between authentic cockpit helmet photo and official portrait, telemetry badge #12,
 * full keyboard navigation, and reduced motion accommodation.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { KIMI_IMAGES } from '../assets/images';
import './Helmet3D.css';

export default function HelmetFallback({
  className = '',
  onRevealChange,
  interactive = true,
}) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, sheenX: 50, sheenY: 50 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const cardRef = useRef(null);

  // Monitor prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(media.matches);

    const listener = (e) => setIsReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const setRevealState = useCallback((revealed) => {
    setIsRevealed(revealed);
    if (onRevealChange) {
      onRevealChange(revealed ? 1.0 : 0.0);
    }
  }, [onRevealChange]);

  // Pointer move calculation for 2.5D CSS tilt
  const handlePointerMove = (e) => {
    if (!interactive || isReducedMotion) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // [-0.5, 0.5]
    const y = (e.clientY - rect.top) / rect.height - 0.5; // [-0.5, 0.5]
    const maxTilt = 12; // degrees

    setTilt({
      rotateX: -y * maxTilt,
      rotateY: x * maxTilt,
      sheenX: (x + 0.5) * 100,
      sheenY: (y + 0.5) * 100,
    });
  };

  const handlePointerEnter = () => {
    if (!interactive) return;
    setRevealState(true);
  };

  const handlePointerLeave = () => {
    if (!interactive) return;
    setRevealState(false);
    setTilt({ rotateX: 0, rotateY: 0, sheenX: 50, sheenY: 50 });
  };

  // Mobile / Touch tap toggle
  const handleClick = () => {
    if (!interactive) return;
    setRevealState(!isRevealed);
  };

  // Keyboard accessibility: Enter or Space toggles reveal
  const handleKeyDown = (e) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setRevealState(!isRevealed);
    }
  };

  // Dynamic CSS transforms
  const cardTransform = isReducedMotion
    ? 'none'
    : `perspective(1000px) rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg) ${isRevealed ? 'scale3d(1.02, 1.02, 1.02)' : 'scale3d(1, 1, 1)'}`;

  return (
    <div className={`helmet-fallback-wrapper ${className}`}>
      <div
        ref={cardRef}
        className={`helmet-fallback-card ${isRevealed ? 'is-revealed' : ''}`}
        style={{
          transform: cardTransform,
          aspectRatio: '3 / 2', // Enforce 3:2 to avoid CLS
        }}
        tabIndex={interactive ? 0 : -1}
        role="region"
        aria-label="Kimi Antonelli 2.5D driver helmet experience card. Press Enter or Space to reveal driver portrait."
        aria-expanded={isRevealed}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Layer 1: Default Closed Helmet Image */}
        <img
          src={KIMI_IMAGES.cockpitHelmet.src}
          alt={KIMI_IMAGES.cockpitHelmet.alt}
          className="fallback-image fallback-image-helmet"
          loading="eager"
          fetchPriority="high"
        />

        {/* Layer 2: Revealed Driver Face Portrait */}
        <img
          src={KIMI_IMAGES.portraitOfficial.src}
          alt={KIMI_IMAGES.portraitOfficial.alt}
          className="fallback-image fallback-image-portrait"
          loading="eager"
          fetchPriority="high"
        />

        {/* Layer 3: Dynamic Holographic Sheen */}
        {!isReducedMotion && (
          <div
            className="fallback-sheen"
            style={{
              background: `radial-gradient(circle at ${tilt.sheenX}% ${tilt.sheenY}%, rgba(0, 210, 190, 0.22) 0%, rgba(255, 255, 255, 0.08) 35%, transparent 70%)`,
            }}
          />
        )}

        {/* Layer 4: Motorsport Telemetry Badges */}
        <div className="fallback-telemetry-overlay">
          <div className="telemetry-badge-number" aria-label="Driver Number 12">
            <span className="badge-prefix">CAR</span>
            <span className="badge-val">#12</span>
          </div>

          <div className="telemetry-badge-status">
            <span className="status-indicator-dot" />
            <span className="status-label">
              {isRevealed ? 'REVEAL // DRIVER FOCUS' : 'TELEMETRY // VISOR CLOSED'}
            </span>
          </div>
        </div>

        {/* Layer 5: Carbon Corner Tech Accents */}
        <div className="fallback-corner-bracket top-left" />
        <div className="fallback-corner-bracket top-right" />
        <div className="fallback-corner-bracket bottom-left" />
        <div className="fallback-corner-bracket bottom-right" />
      </div>
    </div>
  );
}
