#!/usr/bin/env node
/**
 * Empirical Adversarial Test Script for Milestone 1:
 * Asset Import & Scaffolding Pipeline Challenger
 *
 * Verifies:
 * 1. 12 authentic photos exist on disk in src/assets/images/ and are readable.
 * 2. 12 photos match source authentic files in .user_uploaded/ byte-for-byte (size + SHA256).
 * 3. ES module catalog `src/assets/images/index.js` exports KIMI_IMAGES with 12 complete entries.
 * 4. Zero legacy base64 AI images anywhere in src/ or index.html.
 * 5. Production build emits all 12 assets into dist/assets/ with appropriate MIME types & non-zero lengths.
 * 6. dist/index.html references generated chunks and assets without 404 or broken paths.
 * 7. JS bundle size is strictly < 500 KB gzip, CSS is clean and valid.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve('.');
const SRC_IMAGES_DIR = path.join(ROOT_DIR, 'src', 'assets', 'images');
const UPLOADED_DIR = 'C:/Users/PC/.gemini/antigravity/brain/c09273cb-e6bd-453b-9f8f-51c2d663e391/.user_uploaded';
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DIST_ASSETS_DIR = path.join(DIST_DIR, 'assets');

// The 12 authentic photos specified in ORIGINAL_REQUEST.md
const EXPECTED_MAPPING = [
  {
    key: 'heroCollar',
    sourceFile: 'media_1794759077481_90e658ac.png',
    destFile: 'kimi-hero-adjusting-collar.png',
    expectedExt: '.png',
    expectedMime: 'image/png',
    expectedWidth: 666,
    expectedHeight: 375,
    expectedAlpha: true,
  },
  {
    key: 'champion2026',
    sourceFile: 'media_1794759077475_9d3c6b28.jpg',
    destFile: 'kimi-2026-world-champion-stamp.jpg',
    expectedExt: '.jpg',
    expectedMime: 'image/jpeg',
    expectedWidth: 803,
    expectedHeight: 1024,
    expectedAlpha: false,
  },
  {
    key: 'kartingRosberg',
    sourceFile: 'media_1794759266685_c04a8290.jpg',
    destFile: 'kimi-karting-rosberg-2018.jpg',
    expectedExt: '.jpg',
    expectedMime: 'image/jpeg',
    expectedWidth: 387,
    expectedHeight: 516,
    expectedAlpha: false,
  },
  {
    key: 'journeySideBySide',
    sourceFile: 'media_1794759287239_587fcb8f.jpg',
    destFile: 'kimi-journey-kart-to-f1.jpg',
    expectedExt: '.jpg',
    expectedMime: 'image/jpeg',
    expectedWidth: 399,
    expectedHeight: 501,
    expectedAlpha: false,
  },
  {
    key: 'kartingEarly',
    sourceFile: 'media_1794759325583_6ce10f48.png',
    destFile: 'kimi-karting-antonelli-early.png',
    expectedExt: '.png',
    expectedMime: 'image/png',
    expectedWidth: 201,
    expectedHeight: 251,
    expectedAlpha: true,
  },
  {
    key: 'f4Champion2022',
    sourceFile: 'media_1794759346353_3c70a87b.jpg',
    destFile: 'kimi-f4-champion-2022.jpg',
    expectedExt: '.jpg',
    expectedMime: 'image/jpeg',
    expectedWidth: 547,
    expectedHeight: 365,
    expectedAlpha: false,
  },
  {
    key: 'frecaPrema2023',
    sourceFile: 'media_1794759430135_e6c7d6e8.jpg',
    destFile: 'kimi-freca-prema-2023.jpg',
    expectedExt: '.jpg',
    expectedMime: 'image/jpeg',
    expectedWidth: 404,
    expectedHeight: 495,
    expectedAlpha: false,
  },
  {
    key: 'frmecFalcone',
    sourceFile: 'media_1794759474584_5db7865a.jpg',
    destFile: 'kimi-frmec-falcone-thumbsup.jpg',
    expectedExt: '.jpg',
    expectedMime: 'image/jpeg',
    expectedWidth: 1024,
    expectedHeight: 576,
    expectedAlpha: false,
  },
  {
    key: 'cockpitHelmet',
    sourceFile: 'media_1794759555072_b6f015f4.jpg',
    destFile: 'kimi-cockpit-helmet-mercedes.jpg',
    expectedExt: '.jpg',
    expectedMime: 'image/jpeg',
    expectedWidth: 599,
    expectedHeight: 399,
    expectedAlpha: false,
  },
  {
    key: 'portraitOfficial',
    sourceFile: 'media_1794759564452_83fa04f2.png',
    destFile: 'kimi-mercedes-portrait-official.png',
    expectedExt: '.png',
    expectedMime: 'image/png',
    expectedWidth: 440,
    expectedHeight: 440,
    expectedAlpha: true,
  },
  {
    key: 'paddockIntense',
    sourceFile: 'media_1794759573806_d4530a75.jpg',
    destFile: 'kimi-mercedes-paddock-intense.jpg',
    expectedExt: '.jpg',
    expectedMime: 'image/jpeg',
    expectedWidth: 1024,
    expectedHeight: 576,
    expectedAlpha: false,
  },
  {
    key: 'f2Smiling2024',
    sourceFile: 'media_1794759580109_e13c379d.jpg',
    destFile: 'kimi-f2-prema-smiling-2024.jpg',
    expectedExt: '.jpg',
    expectedMime: 'image/jpeg',
    expectedWidth: 800,
    expectedHeight: 600,
    expectedAlpha: false,
  },
];

// Helpers
function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function parseImageDimensions(buf) {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const colorType = buf[25]; // 6 = RGBA
    return { type: 'PNG', width, height, hasAlpha: colorType === 4 || colorType === 6 };
  }
  // JPEG: FF D8
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset < buf.length) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { type: 'JPEG', width, height, hasAlpha: false };
      }
      const len = buf.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
  }
  return { type: 'UNKNOWN', width: 0, height: 0, hasAlpha: false };
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureList = [];

function assert(condition, message, details = {}) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`, details);
    failureList.push({ message, details });
  }
}

console.log('========================================================================');
console.log('  EMPIRICAL ADVERSARIAL CHALLENGE — MILESTONE 1 ASSET & BUNDLE PIPELINE');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: Disk existence & readability of source & destination photos
// -----------------------------------------------------------------------------
console.log('[SECTION 1] Disk Existence, Readability & Byte-for-Byte Authenticity');

assert(fs.existsSync(UPLOADED_DIR), 'Source directory .user_uploaded exists');
assert(fs.existsSync(SRC_IMAGES_DIR), 'Target directory src/assets/images exists');

for (const photo of EXPECTED_MAPPING) {
  const srcPath = path.join(UPLOADED_DIR, photo.sourceFile);
  const destPath = path.join(SRC_IMAGES_DIR, photo.destFile);

  assert(fs.existsSync(srcPath), `Source authentic file exists: ${photo.sourceFile}`);
  assert(fs.existsSync(destPath), `Dest asset file exists: ${photo.destFile}`);

  if (fs.existsSync(srcPath) && fs.existsSync(destPath)) {
    const srcBuf = fs.readFileSync(srcPath);
    const destBuf = fs.readFileSync(destPath);

    assert(destBuf.length > 0, `${photo.destFile} is readable and non-zero (${destBuf.length} bytes)`);
    assert(
      destBuf.length === srcBuf.length,
      `${photo.destFile} size matches source byte-for-byte (${destBuf.length} === ${srcBuf.length})`
    );

    const srcHash = sha256(srcBuf);
    const destHash = sha256(destBuf);
    assert(
      srcHash === destHash,
      `${photo.destFile} SHA-256 hash matches source perfectly: ${srcHash.slice(0, 16)}...`
    );

    // Verify binary magic bytes
    if (photo.expectedExt === '.png') {
      const isPngMagic = destBuf[0] === 0x89 && destBuf[1] === 0x50 && destBuf[2] === 0x4e && destBuf[3] === 0x47;
      assert(isPngMagic, `${photo.destFile} has valid PNG binary magic header`);
    } else if (photo.expectedExt === '.jpg') {
      const isJpgMagic = destBuf[0] === 0xff && destBuf[1] === 0xd8 && destBuf[2] === 0xff;
      assert(isJpgMagic, `${photo.destFile} has valid JPEG binary magic header`);
    }

    // Verify dimension extraction against contract
    const meta = parseImageDimensions(destBuf);
    assert(
      meta.width === photo.expectedWidth && meta.height === photo.expectedHeight,
      `${photo.destFile} binary dimensions ${meta.width}x${meta.height} match expected ${photo.expectedWidth}x${photo.expectedHeight}`
    );
    assert(
      meta.hasAlpha === photo.expectedAlpha,
      `${photo.destFile} binary alpha status (${meta.hasAlpha}) matches expected (${photo.expectedAlpha})`
    );
  }
}

// -----------------------------------------------------------------------------
// SECTION 2: ES Module Catalog src/assets/images/index.js Integrity
// -----------------------------------------------------------------------------
console.log('\n[SECTION 2] ES Module Catalog Integrity (src/assets/images/index.js)');

const catalogPath = path.join(SRC_IMAGES_DIR, 'index.js');
assert(fs.existsSync(catalogPath), 'src/assets/images/index.js exists');

const catalogContent = fs.readFileSync(catalogPath, 'utf8');

// Check that catalog imports each of the 12 files
for (const photo of EXPECTED_MAPPING) {
  assert(
    catalogContent.includes(`./${photo.destFile}`),
    `index.js imports ./${photo.destFile}`
  );
  assert(
    catalogContent.includes(`${photo.key}:`),
    `index.js defines key KIMI_IMAGES.${photo.key}`
  );
}

// Check that no foreign / orphan files exist in src/assets/images/
const diskFiles = fs.readdirSync(SRC_IMAGES_DIR);
const allowedFiles = new Set([...EXPECTED_MAPPING.map((m) => m.destFile), 'index.js']);
const orphanFiles = diskFiles.filter((f) => !allowedFiles.has(f));
assert(
  orphanFiles.length === 0,
  `Zero orphan files in src/assets/images/ (found: ${orphanFiles.join(', ') || 'none'})`
);

// -----------------------------------------------------------------------------
// SECTION 3: Complete AI Image Purge in src/
// -----------------------------------------------------------------------------
console.log('\n[SECTION 3] AI Image Purge Verification');

function scanDirForPatterns(dir, pattern, matches = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        scanDirForPatterns(fullPath, pattern, matches);
      }
    } else if (entry.isFile()) {
      // Check text files
      const ext = path.extname(entry.name);
      if (['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.svg'].includes(ext)) {
        const text = fs.readFileSync(fullPath, 'utf8');
        if (pattern.test(text)) {
          matches.push({ file: fullPath });
        }
      }
    }
  }
  return matches;
}

const base64Matches = scanDirForPatterns(path.join(ROOT_DIR, 'src'), /data:image\/(png|jpeg|webp|gif);base64/i);
assert(base64Matches.length === 0, `Zero base64 image data URLs in src/ (matches: ${base64Matches.length})`);

const rootHtmlMatches = scanDirForPatterns(ROOT_DIR, /data:image\/(png|jpeg|webp|gif);base64/i).filter(
  (m) => path.basename(m.file) === 'index.html'
);
assert(rootHtmlMatches.length === 0, `Zero base64 image data URLs in index.html (matches: ${rootHtmlMatches.length})`);

// -----------------------------------------------------------------------------
// SECTION 4: Fresh Production Build & Static Asset Emission
// -----------------------------------------------------------------------------
console.log('\n[SECTION 4] Fresh Production Build & Static Asset Emission');

console.log('  Executing npm run build...');
const buildStart = Date.now();
let buildSuccess = false;
let buildOutput = '';
try {
  buildOutput = execSync('npm run build', {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  buildSuccess = true;
} catch (err) {
  buildOutput = err.stdout + '\n' + err.stderr;
  buildSuccess = false;
}
const buildDuration = Date.now() - buildStart;

assert(buildSuccess, `npm run build succeeded in ${buildDuration}ms with exit code 0`);
assert(fs.existsSync(DIST_DIR), 'dist/ directory created');
assert(fs.existsSync(DIST_ASSETS_DIR), 'dist/assets/ directory created');

// Check that dist/assets contains all 12 bundled images
const distAssets = fs.existsSync(DIST_ASSETS_DIR) ? fs.readdirSync(DIST_ASSETS_DIR) : [];
assert(distAssets.length >= 14, `dist/assets contains >= 14 items (12 images + JS chunk + CSS chunk). Actual: ${distAssets.length}`);

for (const photo of EXPECTED_MAPPING) {
  const prefix = photo.destFile.replace(/\.(png|jpg)$/, '');
  const ext = photo.expectedExt;
  // Match prefix-[hash].ext
  const emittedFile = distAssets.find((df) => df.startsWith(prefix) && df.endsWith(ext));

  assert(Boolean(emittedFile), `Asset ${photo.destFile} emitted into dist/assets/ as ${emittedFile || 'MISSING'}`);

  if (emittedFile) {
    const emittedPath = path.join(DIST_ASSETS_DIR, emittedFile);
    const emittedBuf = fs.readFileSync(emittedPath);
    assert(emittedBuf.length > 0, `Emitted ${emittedFile} is non-zero byte length (${emittedBuf.length} bytes)`);

    const srcPath = path.join(SRC_IMAGES_DIR, photo.destFile);
    const srcBuf = fs.readFileSync(srcPath);
    const emittedHash = sha256(emittedBuf);
    const srcHash = sha256(srcBuf);
    assert(
      emittedHash === srcHash,
      `Emitted ${emittedFile} preserves exact SHA-256 hash of original asset`
    );

    // Verify MIME type conformance based on emitted extension
    const emittedExt = path.extname(emittedFile).toLowerCase();
    const emittedMime = emittedExt === '.png' ? 'image/png' : emittedExt === '.jpg' ? 'image/jpeg' : 'unknown';
    assert(
      emittedMime === photo.expectedMime,
      `Emitted ${emittedFile} has valid MIME type ${emittedMime} === ${photo.expectedMime}`
    );
  }
}

// -----------------------------------------------------------------------------
// SECTION 5: HTML References & 404 Broken Path Audit
// -----------------------------------------------------------------------------
console.log('\n[SECTION 5] dist/index.html References & Broken Path Audit');

const distHtmlPath = path.join(DIST_DIR, 'index.html');
assert(fs.existsSync(distHtmlPath), 'dist/index.html exists');

const distHtml = fs.readFileSync(distHtmlPath, 'utf8');

// Extract script tags: src="..."
const scriptSrcMatches = [...distHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
assert(scriptSrcMatches.length > 0, `dist/index.html references at least 1 JS script chunk (found: ${scriptSrcMatches.length})`);

for (const src of scriptSrcMatches) {
  // src is typically /assets/index-XXXX.js
  const localRelative = src.startsWith('/') ? src.slice(1) : src;
  const localTarget = path.join(DIST_DIR, localRelative);
  assert(fs.existsSync(localTarget), `Script reference "${src}" exists at ${localTarget} (no 404)`);
}

// Extract stylesheet links: href="..."
const styleHrefMatches = [...distHtml.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)].map((m) => m[1]);
assert(styleHrefMatches.length > 0, `dist/index.html references at least 1 CSS chunk (found: ${styleHrefMatches.length})`);

for (const href of styleHrefMatches) {
  const localRelative = href.startsWith('/') ? href.slice(1) : href;
  const localTarget = path.join(DIST_DIR, localRelative);
  assert(fs.existsSync(localTarget), `Stylesheet reference "${href}" exists at ${localTarget} (no 404)`);
}

// Extract icon link: href="..."
const iconHrefMatches = [...distHtml.matchAll(/<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/gi)].map((m) => m[1]);
for (const href of iconHrefMatches) {
  const localRelative = href.startsWith('/') ? href.slice(1) : href;
  const localTarget = path.join(DIST_DIR, localRelative);
  assert(fs.existsSync(localTarget), `Icon reference "${href}" exists at ${localTarget} (no 404)`);
}

// Check root container
assert(distHtml.includes('id="root"'), 'dist/index.html includes mounting container id="root"');

// -----------------------------------------------------------------------------
// SECTION 6: Bundle Size Stress Test & Clean CSS Validation
// -----------------------------------------------------------------------------
console.log('\n[SECTION 6] Bundle Size Stress Test & Clean CSS Validation');

const jsFiles = distAssets.filter((f) => f.endsWith('.js'));
const cssFiles = distAssets.filter((f) => f.endsWith('.css'));

assert(jsFiles.length > 0, `At least one JS bundle generated (${jsFiles.join(', ')})`);
assert(cssFiles.length > 0, `At least one CSS bundle generated (${cssFiles.join(', ')})`);

const JS_BUDGET_GZIP_BYTES = 500 * 1024; // 500 KB limit

for (const jsFile of jsFiles) {
  const jsPath = path.join(DIST_ASSETS_DIR, jsFile);
  const jsContent = fs.readFileSync(jsPath);
  const jsGzip = zlib.gzipSync(jsContent);
  const gzipKb = (jsGzip.length / 1024).toFixed(2);
  const rawKb = (jsContent.length / 1024).toFixed(2);

  console.log(`  JS Bundle [${jsFile}]: ${rawKb} KB raw | ${gzipKb} KB gzip`);
  assert(
    jsGzip.length < JS_BUDGET_GZIP_BYTES,
    `JS bundle ${jsFile} gzip size (${gzipKb} KB) is strictly < 500 KB budget (${(jsGzip.length / JS_BUDGET_GZIP_BYTES * 100).toFixed(1)}% of budget)`
  );
  assert(jsContent.length > 5000, `JS bundle ${jsFile} contains actual application code (>5KB)`);
}

for (const cssFile of cssFiles) {
  const cssPath = path.join(DIST_ASSETS_DIR, cssFile);
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const cssGzip = zlib.gzipSync(Buffer.from(cssContent, 'utf8'));
  const gzipKb = (cssGzip.length / 1024).toFixed(2);
  const rawKb = (cssContent.length / 1024).toFixed(2);

  console.log(`  CSS Bundle [${cssFile}]: ${rawKb} KB raw | ${gzipKb} KB gzip`);
  assert(cssContent.length > 100, `CSS bundle ${cssFile} is non-trivial (${rawKb} KB)`);

  // Verify CSS cleanliness: balanced braces
  const openBraces = (cssContent.match(/\{/g) || []).length;
  const closeBraces = (cssContent.match(/\}/g) || []).length;
  assert(
    openBraces > 0 && openBraces === closeBraces,
    `CSS ${cssFile} has balanced curly braces (${openBraces} open, ${closeBraces} closed)`
  );

  // Verify no broken or dangling url() statements
  const brokenUrls = [...cssContent.matchAll(/url\(([^)]+)\)/g)].filter(
    (m) => m[1].includes('undefined') || m[1].includes('null') || m[1].length === 0
  );
  assert(brokenUrls.length === 0, `CSS ${cssFile} has zero broken url() references`);
}

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log('  CHALLENGE EXECUTION SUMMARY');
console.log('========================================================================');
console.log(`  Total Invariant Assertions: ${totalTests}`);
console.log(`  Passed Invariants:          ${passedTests}`);
console.log(`  Failed Invariants:          ${failedTests}`);
console.log('------------------------------------------------------------------------');

if (failedTests > 0) {
  console.error(`  VERDICT: REQUEST_CHANGES — ${failedTests} challenge invariants failed!`);
  process.exit(1);
} else {
  console.log('  VERDICT: APPROVE / CONFIRM_CORRECTNESS — 100% invariant pass rate!');
  console.log('========================================================================\n');
  process.exit(0);
}
