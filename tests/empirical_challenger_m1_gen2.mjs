import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: err.message });
    console.error(`  [FAIL] ${name} -> ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('======================================================================');
console.log('   EMPIRICAL CHALLENGER 2: ADVERSARIAL VALIDATION HARNESS (GEN 2)    ');
console.log('======================================================================\n');

// =====================================================================
// SECTION 1: CSS Design Tokens & Variable Contract Verification
// =====================================================================
console.log('>>> 1. CSS Design Tokens & Variable Contract Verification');

const tokensCssPath = path.join(rootDir, 'src', 'styles', 'tokens.css');
assert(fs.existsSync(tokensCssPath), `tokens.css exists at ${tokensCssPath}`);
const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');

// Parse all variables from tokens.css
const tokenRegex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
const declaredTokens = new Map();
let m;
while ((m = tokenRegex.exec(tokensCss)) !== null) {
  declaredTokens.set(m[1], m[2].trim());
}

const requiredTokens = [
  { name: '--bg-deep-carbon', expected: '#0a0d14' },
  { name: '--bg-surface-dark', expected: '#0e121b' },
  { name: '--bg-card-raised', expected: '#141923' },
  { name: '--bg-glass', expected: 'rgba(14, 18, 27, 0.75)' },
  { name: '--mercedes-cyan', expected: '#00d2be' },
  { name: '--mercedes-teal', expected: '#00a19b' },
  { name: '--mercedes-cyan-glow', expected: 'rgba(0, 210, 190, 0.35)' },
  { name: '--mercedes-cyan-subtle', expected: 'rgba(0, 210, 190, 0.12)' },
  { name: '--speed-silver', expected: '#e1e7ec' },
  { name: '--speed-steel', expected: '#b6c1c8' },
  { name: '--racing-red', expected: '#ff1801' },
  { name: '--champion-gold', expected: '#ffd700' },
  { name: '--pure-white', expected: '#ffffff' },
  { name: '--text-muted', expected: '#7a8b99' },
  { name: '--font-display', expected: '"Oswald", "Impact", sans-serif' },
  { name: '--font-mono', expected: '"Space Grotesk", "JetBrains Mono", monospace' },
  { name: '--font-body', expected: '"Space Grotesk", system-ui, -apple-system, sans-serif' },
];

for (const req of requiredTokens) {
  test(`Token ${req.name} is defined in tokens.css`, () => {
    assert(declaredTokens.has(req.name), `Missing token ${req.name}`);
    const actual = declaredTokens.get(req.name);
    // Normalize spaces in quotes and rgba
    const normActual = actual.replace(/\s+/g, ' ');
    const normExpected = req.expected.replace(/\s+/g, ' ');
    assert(normActual === normExpected, `Expected ${normExpected}, got ${normActual}`);
  });
}

// Check syntax validity of all color tokens
const hexPattern = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const rgbaPattern = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(0|1|0?\.\d+)\s*)?\)$/;

for (const [name, val] of declaredTokens.entries()) {
  if (name.startsWith('--bg-') || name.startsWith('--mercedes-') || name.startsWith('--speed-') || name.startsWith('--racing-') || name.startsWith('--champion-') || name.startsWith('--pure-') || name.startsWith('--text-') || name.startsWith('--border-')) {
    test(`Token ${name} has valid CSS color syntax`, () => {
      const isHex = hexPattern.test(val);
      const isRgba = rgbaPattern.test(val);
      assert(isHex || isRgba, `Invalid color syntax for ${name}: ${val}`);
      if (isRgba) {
        const parts = val.match(rgbaPattern);
        const r = parseInt(parts[1], 10);
        const g = parseInt(parts[2], 10);
        const b = parseInt(parts[3], 10);
        assert(r >= 0 && r <= 255, `R channel out of bounds: ${r}`);
        assert(g >= 0 && g <= 255, `G channel out of bounds: ${g}`);
        assert(b >= 0 && b <= 255, `B channel out of bounds: ${b}`);
      }
    });
  }
}

// Check Font Declarations & Fallbacks
for (const fontToken of ['--font-display', '--font-mono', '--font-body']) {
  test(`Font token ${fontToken} includes generic fallback`, () => {
    const val = declaredTokens.get(fontToken);
    assert(val, `${fontToken} must exist`);
    const hasGenericFallback = val.includes('sans-serif') || val.includes('monospace') || val.includes('serif');
    assert(hasGenericFallback, `${fontToken} lacks generic fallback font family: ${val}`);
  });
}

// Contrast Ratio Analysis (WCAG 2.1 AA)
function hexToRgb(hex) {
  let c = hex.slice(1);
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getRelativeLuminance([r, g, b]) {
  const sRGB = [r, g, b].map(v => {
    const val = v / 255;
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const bgCarbonRgb = hexToRgb(declaredTokens.get('--bg-deep-carbon'));
const speedSilverRgb = hexToRgb(declaredTokens.get('--speed-silver'));
const pureWhiteRgb = hexToRgb(declaredTokens.get('--pure-white'));
const mercedesCyanRgb = hexToRgb(declaredTokens.get('--mercedes-cyan'));
const textMutedRgb = hexToRgb(declaredTokens.get('--text-muted'));

test('Contrast Ratio: --pure-white on --bg-deep-carbon meets WCAG AAA (>= 7:1)', () => {
  const ratio = getContrastRatio(pureWhiteRgb, bgCarbonRgb);
  console.log(`    Computed Contrast (--pure-white / --bg-deep-carbon): ${ratio.toFixed(2)}:1`);
  assert(ratio >= 7.0, `Contrast ratio ${ratio.toFixed(2)} is less than 7:1`);
});

test('Contrast Ratio: --speed-silver on --bg-deep-carbon meets WCAG AAA (>= 7:1)', () => {
  const ratio = getContrastRatio(speedSilverRgb, bgCarbonRgb);
  console.log(`    Computed Contrast (--speed-silver / --bg-deep-carbon): ${ratio.toFixed(2)}:1`);
  assert(ratio >= 7.0, `Contrast ratio ${ratio.toFixed(2)} is less than 7:1`);
});

test('Contrast Ratio: --mercedes-cyan on --bg-deep-carbon meets WCAG AA for UI/Large Text (>= 3:1)', () => {
  const ratio = getContrastRatio(mercedesCyanRgb, bgCarbonRgb);
  console.log(`    Computed Contrast (--mercedes-cyan / --bg-deep-carbon): ${ratio.toFixed(2)}:1`);
  assert(ratio >= 3.0, `Contrast ratio ${ratio.toFixed(2)} is less than 3:1`);
});

test('Contrast Ratio: --text-muted on --bg-deep-carbon meets minimum readability (>= 4.5:1 for body)', () => {
  const ratio = getContrastRatio(textMutedRgb, bgCarbonRgb);
  console.log(`    Computed Contrast (--text-muted / --bg-deep-carbon): ${ratio.toFixed(2)}:1`);
  assert(ratio >= 4.5, `Contrast ratio ${ratio.toFixed(2)} is less than 4.5:1`);
});

// =====================================================================
// SECTION 2: Browser Entry Point & Favicon SVG Verification
// =====================================================================
console.log('\n>>> 2. Browser Entry Point & Favicon SVG Verification');

const indexHtmlPath = path.join(rootDir, 'index.html');
assert(fs.existsSync(indexHtmlPath), 'index.html exists');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

test('index.html contains valid doctype, viewport, root element, and module script', () => {
  assert(indexHtml.includes('<!DOCTYPE html>'), 'Missing doctype');
  assert(indexHtml.includes('<meta name="viewport"'), 'Missing viewport meta');
  assert(indexHtml.includes('<div id="root"></div>'), 'Missing #root container');
  assert(indexHtml.includes('<script type="module" src="/src/main.jsx"></script>'), 'Missing module script');
});

test('index.html links to Google Fonts for Oswald and Space Grotesk', () => {
  assert(indexHtml.includes('fonts.googleapis.com'), 'Missing Google Fonts domain');
  assert(indexHtml.includes('family=Oswald'), 'Missing Oswald font');
  assert(indexHtml.includes('family=Space+Grotesk'), 'Missing Space Grotesk font');
});

test('index.html links to /favicon.svg', () => {
  assert(indexHtml.includes('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />'), 'Missing favicon link');
});

const faviconPath = path.join(rootDir, 'public', 'favicon.svg');
test('public/favicon.svg exists and is valid SVG XML', () => {
  assert(fs.existsSync(faviconPath), 'public/favicon.svg must exist');
  const svgContent = fs.readFileSync(faviconPath, 'utf8').trim();
  assert(svgContent.startsWith('<svg') && svgContent.endsWith('</svg>'), 'SVG must have valid start and end tags');
  assert(svgContent.includes('xmlns="http://www.w3.org/2000/svg"'), 'SVG must declare xmlns');
  assert(svgContent.includes('viewBox="0 0 32 32"'), 'SVG must have viewBox');
  assert(svgContent.includes('12'), 'SVG must contain driver number 12');
  assert(svgContent.includes('#00d2be'), 'SVG must use Mercedes cyan');
});

// Test Vite dev/middleware loading of favicon.svg without 404
test('Vite dev server serves /favicon.svg with HTTP 200 without 404', async () => {
  const server = await createServer({
    configFile: path.join(rootDir, 'vite.config.js'),
    root: rootDir,
    server: { port: 3042 }
  });
  await server.listen();
  try {
    const res = await fetch('http://localhost:3042/favicon.svg');
    assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
    const text = await res.text();
    assert(text.includes('<svg'), 'Response must contain svg element');
  } finally {
    await server.close();
  }
});

// =====================================================================
// SECTION 3: Asset Pipeline & Metadata Integrity Verification
// =====================================================================
console.log('\n>>> 3. Asset Pipeline & Metadata Integrity Verification');

const imagesIndexPath = path.join(rootDir, 'src', 'assets', 'images', 'index.js');
test('src/assets/images/index.js exists and exports KIMI_IMAGES', () => {
  assert(fs.existsSync(imagesIndexPath), 'index.js must exist');
});

// Binary parsing helper
function parsePng(buf) {
  assert(buf.readUInt32BE(0) === 0x89504E47 && buf.readUInt32BE(4) === 0x0D0A1A0A, 'Invalid PNG magic bytes');
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const colorType = buf.readUInt8(25);
  return { width, height, hasAlpha: colorType === 4 || colorType === 6 };
}

function parseJpeg(buf) {
  assert(buf.readUInt16BE(0) === 0xFFD8, 'Invalid JPEG magic bytes');
  let offset = 2;
  while (offset < buf.length) {
    const marker = buf.readUInt16BE(offset);
    offset += 2;
    if (marker === 0xFFC0 || marker === 0xFFC1 || marker === 0xFFC2) {
      const height = buf.readUInt16BE(offset + 3);
      const width = buf.readUInt16BE(offset + 5);
      return { width, height, hasAlpha: false };
    }
    const len = buf.readUInt16BE(offset);
    offset += len;
  }
  throw new Error('No SOF marker found in JPEG');
}

const serverForSsr = await createServer({
  configFile: false,
  root: rootDir,
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true }
});

const { KIMI_IMAGES } = await serverForSsr.ssrLoadModule('/src/assets/images/index.js');
await serverForSsr.close();

test('KIMI_IMAGES contains exactly 12 authentic assets with valid physical files', () => {
  const keys = Object.keys(KIMI_IMAGES);
  assert(keys.length === 12, `Expected 12 keys, got ${keys.length}`);

  for (const key of keys) {
    const item = KIMI_IMAGES[key];
    assert(typeof item.src === 'string', `${key}.src must be a string`);
    assert(typeof item.alt === 'string' && item.alt.length > 5, `${key}.alt must be descriptive`);
    assert(Number.isInteger(item.width) && item.width > 0, `${key}.width must be > 0`);
    assert(Number.isInteger(item.height) && item.height > 0, `${key}.height must be > 0`);
    assert(typeof item.hasAlpha === 'boolean', `${key}.hasAlpha must be boolean`);

    const filename = path.basename(item.src);
    const diskPath = path.join(rootDir, 'src', 'assets', 'images', filename);
    assert(fs.existsSync(diskPath), `Physical file ${filename} must exist on disk`);
    
    const buffer = fs.readFileSync(diskPath);
    let physical;
    if (diskPath.endsWith('.png')) {
      physical = parsePng(buffer);
    } else {
      physical = parseJpeg(buffer);
    }

    assert(physical.width === item.width, `${key} width mismatch: physical ${physical.width} vs metadata ${item.width}`);
    assert(physical.height === item.height, `${key} height mismatch: physical ${physical.height} vs metadata ${item.height}`);
    assert(physical.hasAlpha === item.hasAlpha, `${key} hasAlpha mismatch: physical ${physical.hasAlpha} vs metadata ${item.hasAlpha}`);
  }
});

test('Zero base64 or AI image markers in src/', () => {
  const findFiles = (dir) => {
    let results = [];
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) results = results.concat(findFiles(full));
      else results.push(full);
    }
    return results;
  };
  const files = findFiles(path.join(rootDir, 'src'));
  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.html')) {
      const c = fs.readFileSync(file, 'utf8');
      assert(!c.includes('data:image/'), `Found base64 image in ${file}`);
    }
  }
});

// =====================================================================
// SECTION 4: Production Build, Dist Inspection & Isolation Verification
// =====================================================================
console.log('\n>>> 4. Production Build, Dist Inspection & Isolation Verification');

test('npm run build succeeds with exit code 0', () => {
  const out = execSync('npm run build', { cwd: rootDir, encoding: 'utf8' });
  assert(out.includes('built in'), 'Build output missing completion message');
});

const distDir = path.join(rootDir, 'dist');
test('dist/ directory contains required static assets', () => {
  assert(fs.existsSync(distDir), 'dist/ directory must exist');
  assert(fs.existsSync(path.join(distDir, 'index.html')), 'dist/index.html must exist');
  assert(fs.existsSync(path.join(distDir, 'favicon.svg')), 'dist/favicon.svg must exist');
  assert(fs.existsSync(path.join(distDir, 'assets')), 'dist/assets directory must exist');
});

test('index.html.legacy.bak is strictly isolated and NOT bundled into dist/', () => {
  const bakPath = path.join(rootDir, 'index.html.legacy.bak');
  assert(fs.existsSync(bakPath), 'index.html.legacy.bak must exist as backup');

  const distFiles = fs.readdirSync(path.join(distDir, 'assets'));
  for (const f of distFiles) {
    assert(!f.includes('legacy'), `Found legacy reference in dist/assets/${f}`);
    assert(!f.endsWith('.bak'), `Found .bak file in dist/assets/${f}`);
  }

  const distHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  assert(!distHtml.includes('index.html.legacy.bak'), 'dist/index.html references legacy backup file');
  assert(!distHtml.includes('data:image/'), 'dist/index.html contains leaked base64 AI image');

  // Verify size of dist/index.html is clean (< 5KB), NOT the 1MB monolithic file
  const distHtmlStats = fs.statSync(path.join(distDir, 'index.html'));
  assert(distHtmlStats.size < 5000, `dist/index.html is suspiciously large (${distHtmlStats.size} bytes)`);
});

test('All 12 authentic images are emitted into dist/assets/', () => {
  const distAssetFiles = fs.readdirSync(path.join(distDir, 'assets'));
  const imageAssets = distAssetFiles.filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  assert(imageAssets.length === 12, `Expected 12 image assets in dist/assets, found ${imageAssets.length}`);
});

// =====================================================================
// SECTION 5: E2E Test Suite Execution
// =====================================================================
console.log('\n>>> 5. Independent E2E Test Suite Execution');

test('npm test passes 100% of the 117 tests', () => {
  const testOutput = execSync('npm test', { cwd: rootDir, encoding: 'utf8' });
  assert(testOutput.includes('All 117 tests passed successfully!'), 'Test suite failed or did not report 117 tests');
});

// =====================================================================
// FINAL SUMMARY
// =====================================================================
console.log('\n======================================================================');
console.log(`CHALLENGER 2 VERDICT: ${results.failed === 0 ? 'APPROVE' : 'REJECT'}`);
console.log(`Total Tests Run: ${results.passed + results.failed}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log('======================================================================\n');

if (results.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
