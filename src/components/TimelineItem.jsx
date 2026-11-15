import React, { useEffect, useRef, useState } from 'react';
import './CareerTimeline.css';

/**
 * TimelineItem Component
 * Individual milestone card rendering alternating layout (odd: left, even: right),
 * authentic imagery, telemetry badges, and keyboard focus states.
 */
export default function TimelineItem({
  item,
  index,
  isLeft,
  isActive,
  onVisible,
}) {
  const itemRef = useRef(null);
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const element = itemRef.current;
    if (!element) return;

    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInViewport(true);
            if (onVisible) onVisible(index);
          }
        },
        {
          threshold: 0.25,
          rootMargin: '-10% 0px -20% 0px',
        }
      );

      observer.observe(element);
      return () => observer.disconnect();
    } else {
      // Fallback for environments without IntersectionObserver
      setIsInViewport(true);
      if (onVisible) onVisible(index);
    }
  }, [index, onVisible]);

  // Side classification matching test runner contracts
  const sideClass = isLeft ? 'timeline-left timeline-row-left' : 'timeline-right timeline-row-right';
  const connectorDirection = isLeft ? 'pointing-right' : 'pointing-left';

  return (
    <li
      id={item.id}
      ref={itemRef}
      className={`timeline-row ${sideClass} ${isInViewport ? 'is-visible' : ''} ${isActive ? 'is-active' : ''}`}
      tabIndex={0}
      aria-label={`${item.year}: ${item.title}`}
    >
      {/* Horizontal Connector Branch */}
      <div
        className={`timeline-connector ${connectorDirection}`}
        aria-hidden="true"
        style={{ '--item-accent': item.accentColor }}
      />

      {/* Central Illuminated Node */}
      <div
        className={`timeline-node ${isActive ? 'node-active' : ''}`}
        aria-hidden="true"
        style={{ '--item-accent': item.accentColor }}
      >
        <span className="node-outer-ring" />
        <span className="node-core">
          <span className="node-number">{index + 1}</span>
        </span>
      </div>

      {/* Milestone Content Card */}
      <article className="timeline-card">
        {/* Card Header Meta */}
        <div className="card-top-bar">
          <div className="card-meta">
            <span className="meta-category">{item.category}</span>
            <span className="meta-divider">•</span>
            <span className="meta-year">{item.year}</span>
            <span className="meta-divider">•</span>
            <span className="meta-age">{item.age}</span>
          </div>
          <span
            className="card-tag-pill"
            style={{
              borderColor: item.accentColor,
              color: item.accentColor,
              backgroundColor: `${item.accentColor}18`,
            }}
          >
            {item.tag}
          </span>
        </div>

        {/* Card Titles */}
        <h3 className="card-title">{item.title}</h3>
        <p className="card-subtitle">{item.subtitle}</p>

        {/* Media Container with Motorsport Tech Brackets */}
        <div className={`card-image-wrapper ${item.image?.hasAlpha ? 'has-alpha-bg' : ''}`}>
          <img
            src={item.image?.src || item.photoPath}
            alt={item.image?.alt || item.photoAlt || item.title}
            loading="lazy"
            decoding="async"
            width={item.image?.width}
            height={item.image?.height}
            className="card-image"
          />
          <div className="card-image-overlay" aria-hidden="true" />
          <span className="bracket bracket-tl" aria-hidden="true" />
          <span className="bracket bracket-tr" aria-hidden="true" />
          <span className="bracket bracket-bl" aria-hidden="true" />
          <span className="bracket bracket-br" aria-hidden="true" />
        </div>

        {/* Technical Specs Tags */}
        <div className="card-specs">
          <div className="spec-item">
            <span className="spec-label">TEAM:</span>
            <span className="spec-val">{item.team}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">CAR:</span>
            <span className="spec-val">{item.car}</span>
          </div>
        </div>

        {/* Key Achievements Bulleted List */}
        <ul className="card-achievements" aria-label="Key Achievements">
          {item.achievements.map((ach, aIdx) => (
            <li key={aIdx} className="achievement-bullet">
              <span className="bullet-chevron" style={{ color: item.accentColor }} aria-hidden="true">»</span>
              <span className="bullet-text">{ach}</span>
            </li>
          ))}
        </ul>

        {/* Narrative Description */}
        <p className="card-narrative">{item.description}</p>

        {/* Metric Telemetry Badges (if provided) */}
        {item.stats && item.stats.length > 0 && (
          <div className="card-telemetry-grid">
            {item.stats.map((st, sIdx) => (
              <div key={sIdx} className="telemetry-pill">
                <span className="telemetry-pill-label">{st.label}</span>
                <span className="telemetry-pill-value" style={{ color: item.accentColor }}>{st.value}</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </li>
  );
}
