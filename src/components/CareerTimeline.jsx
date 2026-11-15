import React, { useState, useEffect, useRef } from 'react';
import { CAREER_MILESTONES } from '../data/careerTimeline';
import TimelineItem from './TimelineItem';
import './CareerTimeline.css';

/**
 * CareerTimeline Component
 * Encapsulates the central vertical illuminated spine, scroll progress tracking,
 * and alternating milestone cards for Andrea Kimi Antonelli's career trajectory.
 */
export default function CareerTimeline({ milestones = CAREER_MILESTONES, className = '' }) {
  const [highestActiveIndex, setHighestActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0.05);
  const timelineRef = useRef(null);

  // Scroll-driven progress calculation for central spine
  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress starting when timeline enters mid-viewport
      const startOffset = windowHeight * 0.5;
      const currentScroll = startOffset - rect.top;
      const totalHeight = rect.height;

      const rawProgress = currentScroll / totalHeight;
      const clamped = Math.min(Math.max(rawProgress, 0.04), 1.0);
      setScrollProgress(clamped);

      // Determine active milestone index based on scroll position
      const estimatedIndex = Math.min(
        Math.floor(clamped * milestones.length),
        milestones.length - 1
      );
      setHighestActiveIndex((prev) => Math.max(prev, estimatedIndex));

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollProgress();

    // Support anchor navigation jumps (e.g. #milestone-5)
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const targetIndex = milestones.findIndex((m) => `#${m.id}` === hash);
      if (targetIndex >= 0) {
        setHighestActiveIndex((prev) => Math.max(prev, targetIndex));
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [milestones]);

  // Callback from TimelineItem intersection
  const handleMilestoneVisible = (index) => {
    setHighestActiveIndex((prev) => Math.max(prev, index));
  };

  return (
    <section
      id="timeline"
      className={`career-timeline-section ${className}`}
      aria-label="Career Trajectory Timeline"
      data-timeline
      ref={timelineRef}
    >
      <div className="timeline-header">
        <div className="timeline-eyebrow">
          <span className="eyebrow-slash">//</span> 03 — CAREER TRAJECTORY
        </div>
        <h2 className="timeline-heading">FROM KARTS TO FORMULA 1</h2>
        <p className="timeline-lead">
          Seven defining epochs tracking Andrea Kimi Antonelli's meteoric ascent
          from grassroots karting in Bologna to the Mercedes-AMG PETRONAS F1 works seat.
        </p>
      </div>

      <div className="timeline-track-container">
        {/* Central Vertical Spine Track */}
        <div className="timeline-spine-track" aria-hidden="true">
          <div
            className="timeline-spine-glow"
            style={{ transform: `scaleY(${scrollProgress})` }}
          />
        </div>

        {/* Milestone Cards Alternating List */}
        <ol className="timeline-list" role="list">
          {milestones.map((item, index) => {
            const isLeft = index % 2 === 0;
            // Consecutive lighting: all nodes up to highestActiveIndex remain illuminated
            const isIlluminated = index <= highestActiveIndex;

            return (
              <TimelineItem
                key={item.id}
                item={item}
                index={index}
                isLeft={isLeft}
                isActive={isIlluminated}
                onVisible={handleMilestoneVisible}
              />
            );
          })}
        </ol>
      </div>
    </section>
  );
}
