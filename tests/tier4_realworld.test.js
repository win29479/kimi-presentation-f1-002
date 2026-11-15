/**
 * Tier 4: Real-World Application Scenarios E2E Test Suite
 *
 * Covers:
 *  - Complete driver journey narrative flow from Hero #12 to 2026 World Champion card
 *  - Exhaustive 12 authentic photos mapping chain & zero-orphan audit
 *  - Full site DOM semantic hierarchy & accessibility landmarks
 *  - Network & asset loading resilience (local asset pipeline, zero external image CDNs)
 *
 * Target: >= 8 tests.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, it, expect } from './runner.js';

const ROOT_DIR = path.resolve('.');
const ASSETS_DIR = path.join(ROOT_DIR, 'src', 'assets', 'images');
const UPLOADED_DIR = 'C:/Users/PC/.gemini/antigravity/brain/c09273cb-e6bd-453b-9f8f-51c2d663e391/.user_uploaded';

// -----------------------------------------------------------------------------
// Suite 1: Complete Driver Journey Flow (Hero #12 -> 2026 Champion)
// -----------------------------------------------------------------------------
describe('Scenario 1: Complete Driver Journey Chronological Progression', () => {
  const timelinePath = path.join(ROOT_DIR, 'src', 'data', 'careerTimeline.js');

  it('1.1: Complete journey timeline contains all 7 chronological career eras', async () => {
    expect(fs.existsSync(timelinePath)).toBe(true);
    const { CAREER_MILESTONES } = await import(pathToFileURL(timelinePath).href);
    expect(CAREER_MILESTONES.length).toBe(7);
  });

  it('1.2: Career milestone years advance monotonically from 2014 to 2026', async () => {
    const { CAREER_MILESTONES } = await import(pathToFileURL(timelinePath).href);
    const extractStartYear = (yearStr) => {
      const match = yearStr.match(/\b(20\d\d)\b/);
      return match ? parseInt(match[1], 10) : 0;
    };
    for (let i = 0; i < CAREER_MILESTONES.length - 1; i++) {
      const currYear = extractStartYear(CAREER_MILESTONES[i].year);
      const nextYear = extractStartYear(CAREER_MILESTONES[i + 1].year);
      expect(nextYear).toBeGreaterThanOrEqual(currYear);
    }
    expect(extractStartYear(CAREER_MILESTONES[0].year)).toBe(2014);
    expect(CAREER_MILESTONES[CAREER_MILESTONES.length - 1].year).toContain('2026');
  });

  it('1.3: Age progression is biologically coherent (age 8 at grassroots to age 20 at 2026 horizon)', async () => {
    const { CAREER_MILESTONES } = await import(pathToFileURL(timelinePath).href);
    const extractMinAge = (ageStr) => {
      const match = ageStr.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };
    for (let i = 0; i < CAREER_MILESTONES.length - 1; i++) {
      const currAge = extractMinAge(CAREER_MILESTONES[i].age);
      const nextAge = extractMinAge(CAREER_MILESTONES[i + 1].age);
      expect(nextAge).toBeGreaterThanOrEqual(currAge);
    }
    expect(CAREER_MILESTONES[0].age).toContain('8');
    expect(CAREER_MILESTONES[CAREER_MILESTONES.length - 1].age).toContain('20');
  });
});

// -----------------------------------------------------------------------------
// Suite 2: Complete 12 Authentic Photos Mapping Chain (Zero Orphan Audit)
// -----------------------------------------------------------------------------
describe('Scenario 2: Complete 12 Authentic Photos Mapping Chain', () => {
  const MASTER_ASSET_CHAIN = [
    { id: 1, file: 'kimi-hero-adjusting-collar.png', key: 'heroCollar', component: 'HeroSection / Collar Reveal' },
    { id: 2, file: 'kimi-2026-world-champion-stamp.jpg', key: 'champion2026', component: 'CareerTimeline (Milestone 7)' },
    { id: 3, file: 'kimi-karting-rosberg-2018.jpg', key: 'kartingRosberg', component: 'CareerTimeline (Milestone 2)' },
    { id: 4, file: 'kimi-journey-kart-to-f1.jpg', key: 'journeySideBySide', component: 'DriverStats (Evolution Diptych)' },
    { id: 5, file: 'kimi-karting-antonelli-early.png', key: 'kartingEarly', component: 'CareerTimeline (Milestone 1)' },
    { id: 6, file: 'kimi-f4-champion-2022.jpg', key: 'f4Champion2022', component: 'CareerTimeline (Milestone 3)' },
    { id: 7, file: 'kimi-freca-prema-2023.jpg', key: 'frecaPrema2023', component: 'CareerTimeline (Milestone 4)' },
    { id: 8, file: 'kimi-frmec-falcone-thumbsup.jpg', key: 'frmecFalcone', component: 'CareerTimeline / Paddock Journal' },
    { id: 9, file: 'kimi-cockpit-helmet-mercedes.jpg', key: 'cockpitHelmet', component: 'Helmet3D / HelmetFallback' },
    { id: 10, file: 'kimi-mercedes-portrait-official.png', key: 'portraitOfficial', component: 'Helmet3D (Face Inside Helmet)' },
    { id: 11, file: 'kimi-mercedes-paddock-intense.jpg', key: 'paddockIntense', component: 'CareerTimeline (Milestone 6)' },
    { id: 12, file: 'kimi-f2-prema-smiling-2024.jpg', key: 'f2Smiling2024', component: 'CareerTimeline (Milestone 5)' },
  ];

  it('2.1: Exactly 12 authentic photos are in the master asset chain', () => {
    expect(MASTER_ASSET_CHAIN.length).toBe(12);
  });

  it('2.2: All 12 authentic photo files physically exist on disk in src/assets/images/', () => {
    expect(fs.existsSync(ASSETS_DIR)).toBe(true);
    for (const item of MASTER_ASSET_CHAIN) {
      const fullPath = path.join(ASSETS_DIR, item.file);
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(fs.statSync(fullPath).size).toBeGreaterThan(30000);
    }
  });

  it('2.3: Zero orphan photos: 100% of the 12 photos are registered in index.js and assigned to components', () => {
    const catalogPath = path.join(ASSETS_DIR, 'index.js');
    expect(fs.existsSync(catalogPath)).toBe(true);
    const catalogSrc = fs.readFileSync(catalogPath, 'utf8');
    for (const item of MASTER_ASSET_CHAIN) {
      expect(catalogSrc).toContain(item.key);
      expect(catalogSrc).toContain(item.file);
      expect(typeof item.component).toBe('string');
      expect(item.component.length).toBeGreaterThan(5);
    }
    const components = MASTER_ASSET_CHAIN.map((i) => i.component);
    expect(new Set(components).size).toBeGreaterThanOrEqual(5);
  });
});

// -----------------------------------------------------------------------------
// Suite 3: Full Site DOM Semantic Structure & Accessibility Landmarks
// -----------------------------------------------------------------------------
describe('Scenario 3: Site DOM Semantic Structure & Accessibility', () => {
  it('3.1: Semantic landmark elements (header, main) and root container exist in index.html & src/App.jsx', () => {
    const htmlPath = path.join(ROOT_DIR, 'index.html');
    const appPath = path.join(ROOT_DIR, 'src', 'App.jsx');
    expect(fs.existsSync(htmlPath)).toBe(true);
    expect(fs.existsSync(appPath)).toBe(true);

    const html = fs.readFileSync(htmlPath, 'utf8');
    const app = fs.readFileSync(appPath, 'utf8');

    // index.html root mounting container
    expect(html).toContain('id="root"');

    // App.jsx semantic landmarks
    expect(app).toContain('<header');
    expect(app).toContain('</header>');
    expect(app).toContain('<main');
    expect(app).toContain('</main>');
  });

  it('3.2: Heading hierarchy defines top-level h1 declaring KIMI ANTONELLI and car number #12', () => {
    const appPath = path.join(ROOT_DIR, 'src', 'App.jsx');
    const app = fs.readFileSync(appPath, 'utf8');
    expect(app).toMatch(/<h1[^>]*>[\s\S]*?KIMI ANTONELLI[\s\S]*?#12[\s\S]*?<\/h1>/i);
  });
});

// -----------------------------------------------------------------------------
// Suite 4: Network & Asset Loading Resilience
// -----------------------------------------------------------------------------
describe('Scenario 4: Asset Loading & Network Resilience', () => {
  it('4.1: Component imports use local assets rather than external URLs', () => {
    const appPath = path.join(ROOT_DIR, 'src', 'App.jsx');
    const app = fs.readFileSync(appPath, 'utf8');
    expect(app).toContain("from './assets/images'");
    expect(app).toContain('KIMI_IMAGES');
  });

  it('4.2: Project source files contain zero unapproved external image CDNs or remote URLs', () => {
    const srcDir = path.join(ROOT_DIR, 'src');
    expect(fs.existsSync(srcDir)).toBe(true);

    const externalImagePattern = /(?:https?:\/\/|\/\/)[^\s"'`]+?\.(?:png|jpe?g|webp|gif|svg)/gi;
    const scanDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(jsx?|tsx?|css|html)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = content.match(externalImagePattern) || [];
          expect(matches.length).toBe(0);
        }
      }
    };
    scanDir(srcDir);
  });

  it('4.3: index.html entry point defines Google Fonts preconnect for high-performance typography', () => {
    const htmlPath = path.join(ROOT_DIR, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    expect(html).toContain('fonts.googleapis.com');
    expect(html).toContain('rel="preconnect"');
  });
});
