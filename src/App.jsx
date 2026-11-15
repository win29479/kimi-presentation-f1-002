import React from 'react';
import { KIMI_IMAGES } from './assets/images';

export default function App() {
  const assetKeys = Object.keys(KIMI_IMAGES);

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--bg-deep-carbon)' }}>
      <header style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--pure-white)' }}>
          KIMI ANTONELLI <span style={{ color: 'var(--mercedes-cyan)' }}>#12</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          MERCEDES-AMG PETRONAS FORMULA ONE TEAM — 2026 CHAMPION HORIZON
        </p>
      </header>

      <main style={{ marginTop: '2rem' }}>
        <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-dark)', border: '1px solid var(--border-cyan)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--mercedes-cyan)', fontSize: '1rem', marginBottom: '1rem' }}>
            [M1 Foundation Ready] Authentic Asset Pipeline Initialized ({assetKeys.length} assets cataloged)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {assetKeys.map((key) => {
              const img = KIMI_IMAGES[key];
              return (
                <div key={key} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-card-raised)', border: '1px solid var(--border-subtle)' }}>
                  <img src={img.src} alt={img.alt} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--speed-silver)', marginTop: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {key}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {img.width}x{img.height} {img.hasAlpha ? '(alpha)' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
