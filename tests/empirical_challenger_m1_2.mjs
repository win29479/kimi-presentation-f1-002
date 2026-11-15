import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const report = {
  passed: 0,
  failed: 0,
  assertions: [],
  details: {}
};

function assert(condition, message, meta = {}) {
  if (condition) {
    report.passed++;
    report.assertions.push({ status: 'PASS', message, meta });
    console.log(`  [PASS] ${message}`);
  } else {
    report.failed++;
    report.assertions.push({ status: 'FAIL', message, meta });
    console.error(`  [FAIL] ${message}`, meta);
  }
}

console.log('=== EMPIRICAL CHALLENGER M1-2: RUNTIME & TOKEN INTEGRITY TEST ===\n');

// -------------------------------------------------------------
// PART 1: Design Tokens in src/styles/tokens.css & SCOPE.md
// -------------------------------------------------------------
console.log('--- 1. Testing Design Tokens in tokens.css against SCOPE.md ---');
const tokensCssPath = path.join(rootDir, 'src', 'styles', 'tokens.css');
const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');

const expectedTokens = [
  { name: '--bg-deep-carbon', type: 'color' },
  { name: '--bg-surface-dark', type: 'color' },
  { name: '--bg-card-raised', type: 'color' },
  { name: '--bg-glass', type: 'color' },
  { name: '--mercedes-cyan', type: 'color' },
  { name: '--mercedes-teal', type: 'color' },
  { name: '--mercedes-cyan-glow', type: 'color' },
  { name: '--mercedes-cyan-subtle', type: 'color' },
  { name: '--speed-silver', type: 'color' },
  { name: '--speed-steel', type: 'color' },
  { name: '--racing-red', type: 'color' },
  { name: '--champion-gold', type: 'color' },
  { name: '--pure-white', type: 'color' },
  { name: '--text-muted', type: 'color' },
  { name: '--font-display', type: 'font' },
  { name: '--font-mono', type: 'font' },
  { name: '--font-body', type: 'font' },
];

const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/;
const calcRegex = /^calc\(.+\)$/;

// Extract all CSS variable definitions
const tokenRegex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
const declaredTokens = new Map();
let match;
while ((match = tokenRegex.exec(tokensCss)) !== null) {
  declaredTokens.set(match[1], match[2].trim());
}

for (const expected of expectedTokens) {
  const exists = declaredTokens.has(expected.name);
  assert(exists, `Token ${expected.name} must exist in tokens.css`);
  if (exists) {
    const val = declaredTokens.get(expected.name);
    if (expected.type === 'color') {
      const isValidColor = hexRegex.test(val) || rgbRegex.test(val) || calcRegex.test(val);
      assert(isValidColor, `Token ${expected.name} value "${val}" must have valid hex, rgb, or calc syntax`);
    } else if (expected.type === 'font') {
      const isValidFont = val.length > 0 && (val.includes('"') || val.includes("'") || val.includes('sans-serif') || val.includes('monospace'));
      assert(isValidFont, `Token ${expected.name} value "${val}" must have valid font-family definition`);
    }
  }
}

// Check for any duplicate token declarations in tokens.css
const allTokensMatches = [...tokensCss.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)].map(m => m[1]);
const uniqueTokens = new Set(allTokensMatches);
assert(allTokensMatches.length === uniqueTokens.size, `tokens.css has zero duplicate token declarations (${allTokensMatches.length} vs ${uniqueTokens.size})`);

// -------------------------------------------------------------
// PART 2: Runtime Contract in src/assets/images/index.js
// -------------------------------------------------------------
console.log('\n--- 2. Testing Runtime Contract in src/assets/images/index.js ---');
const indexJsPath = path.join(rootDir, 'src', 'assets', 'images', 'index.js');
const indexJsContent = fs.readFileSync(indexJsPath, 'utf8');

// Check duplicate keys in object declaration via regex
const keyMatches = [...indexJsContent.matchAll(/^\s{2}([a-zA-Z0-9_]+)\s*:\s*\{/gm)].map(m => m[1]);
const uniqueKeys = new Set(keyMatches);
assert(keyMatches.length === uniqueKeys.size, `KIMI_IMAGES object has zero duplicate keys (${keyMatches.length} defined, ${uniqueKeys.size} unique)`);

// Check export syntax in file
assert(indexJsContent.includes('export const KIMI_IMAGES = {'), 'index.js exports named KIMI_IMAGES');
assert(indexJsContent.includes('export default KIMI_IMAGES;'), 'index.js exports default KIMI_IMAGES');

// Import the module dynamically via Vite SSR to verify full bundler runtime contract
const viteServer = await createServer({
  configFile: false,
  root: rootDir,
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true }
});

const importedModule = await viteServer.ssrLoadModule('/src/assets/images/index.js');
const { KIMI_IMAGES, default: defaultExport } = importedModule;

assert(KIMI_IMAGES !== undefined, 'KIMI_IMAGES is defined and exported by module');
assert(defaultExport === KIMI_IMAGES, 'default export is strictly equal to KIMI_IMAGES');

const expectedKeys = [
  'heroCollar',
  'champion2026',
  'kartingRosberg',
  'journeySideBySide',
  'kartingEarly',
  'f4Champion2022',
  'frecaPrema2023',
  'frmecFalcone',
  'cockpitHelmet',
  'portraitOfficial',
  'paddockIntense',
  'f2Smiling2024'
];

assert(Object.keys(KIMI_IMAGES).length === 12, `KIMI_IMAGES has exactly 12 keys (got ${Object.keys(KIMI_IMAGES).length})`);

for (const expectedKey of expectedKeys) {
  const entry = KIMI_IMAGES[expectedKey];
  assert(entry !== undefined, `KIMI_IMAGES.${expectedKey} is defined`);
  if (!entry) continue;

  assert(typeof entry.src === 'string' && entry.src.length > 0, `KIMI_IMAGES.${expectedKey}.src is non-empty string ("${entry.src}")`);
  assert(typeof entry.alt === 'string' && entry.alt.length > 0, `KIMI_IMAGES.${expectedKey}.alt is non-empty string`);
  assert(Number.isInteger(entry.width) && entry.width > 0, `KIMI_IMAGES.${expectedKey}.width (${entry.width}) is strictly positive integer`);
  assert(Number.isInteger(entry.height) && entry.height > 0, `KIMI_IMAGES.${expectedKey}.height (${entry.height}) is strictly positive integer`);
  assert(typeof entry.hasAlpha === 'boolean', `KIMI_IMAGES.${expectedKey}.hasAlpha is boolean (${entry.hasAlpha})`);
}

// -------------------------------------------------------------
// PART 3: Binary Image Dimension & Alpha Integrity Verification
// -------------------------------------------------------------
console.log('\n--- 3. Verifying Physical File Dimensions & Alpha against Stored Metadata ---');

function getPngDimensions(buf) {
  if (buf.readUInt32BE(0) !== 0x89504E47 || buf.readUInt32BE(4) !== 0x0D0A1A0A) {
    throw new Error('Not a PNG');
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const colorType = buf.readUInt8(25);
  const hasAlpha = colorType === 4 || colorType === 6; // 4 = Greyscale+Alpha, 6 = Truecolor+Alpha
  return { width, height, hasAlpha, type: 'png' };
}

function getJpegDimensions(buf) {
  if (buf.readUInt16BE(0) !== 0xFFD8) {
    throw new Error('Not a JPEG');
  }
  let offset = 2;
  while (offset < buf.length) {
    const marker = buf.readUInt16BE(offset);
    offset += 2;
    if (marker === 0xFFC0 || marker === 0xFFC1 || marker === 0xFFC2) {
      const height = buf.readUInt16BE(offset + 3);
      const width = buf.readUInt16BE(offset + 5);
      return { width, height, hasAlpha: false, type: 'jpeg' };
    }
    const len = buf.readUInt16BE(offset);
    offset += len;
  }
  throw new Error('Could not find JPEG SOF marker');
}

function getImageInfo(filePath) {
  const buf = fs.readFileSync(filePath);
  if (filePath.endsWith('.png')) {
    return getPngDimensions(buf);
  } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    return getJpegDimensions(buf);
  }
  throw new Error(`Unsupported format: ${filePath}`);
}

for (const key of expectedKeys) {
  const entry = KIMI_IMAGES[key];
  const fileName = path.basename(entry.src);
  const localFilePath = path.join(rootDir, 'src', 'assets', 'images', fileName);
  
  assert(fs.existsSync(localFilePath), `Image file ${fileName} exists on disk at ${localFilePath}`);
  if (fs.existsSync(localFilePath)) {
    const stats = fs.statSync(localFilePath);
    assert(stats.size > 0, `Image file ${fileName} is non-empty (${stats.size} bytes)`);

    try {
      const dim = getImageInfo(localFilePath);
      assert(dim.width === entry.width, `Image ${fileName} physical width (${dim.width}) matches metadata (${entry.width})`);
      assert(dim.height === entry.height, `Image ${fileName} physical height (${dim.height}) matches metadata (${entry.height})`);
      assert(dim.hasAlpha === entry.hasAlpha, `Image ${fileName} physical hasAlpha (${dim.hasAlpha}) matches metadata (${entry.hasAlpha})`);
    } catch (err) {
      assert(false, `Failed to parse dimensions of ${fileName}: ${err.message}`);
    }
  }
}

await viteServer.close();

// -------------------------------------------------------------
// PART 4: Run E2E Test Suite via runner.js
// -------------------------------------------------------------
console.log('\n--- 4. Verifying E2E Test Suite (npm test / node tests/runner.js) ---');
try {
  const testOutput = execSync('node tests/runner.js', { cwd: rootDir, encoding: 'utf8' });
  const passed117 = testOutput.includes('All 117 tests passed successfully!');
  assert(passed117, 'npm test (node tests/runner.js) passes 100% of 117 tests', {
    hasSummary: testOutput.includes('TEST EXECUTION SUMMARY'),
  });
} catch (err) {
  assert(false, `npm test threw an error: ${err.message}`);
}

// -------------------------------------------------------------
// PART 5: Adversarial Stress Tests & Edge Cases
// -------------------------------------------------------------
console.log('\n--- 5. Adversarial Stress Tests & Edge Cases ---');

// Stress 1: Check for any dangling base64 or AI image markers in src/
const allSrcFiles = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else allSrcFiles.push(p);
  }
}
walk(path.join(rootDir, 'src'));

let foundBase64 = 0;
for (const file of allSrcFiles) {
  if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.html')) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('data:image/')) {
      foundBase64++;
    }
  }
}
assert(foundBase64 === 0, `Zero base64 data URLs found in all ${allSrcFiles.length} files under src/`);

// Stress 2: Verify Vite production build
console.log('\n--- 6. Verifying Production Build (npm run build) ---');
try {
  const buildOutput = execSync('npm run build', { cwd: rootDir, encoding: 'utf8' });
  const buildSuccess = fs.existsSync(path.join(rootDir, 'dist', 'index.html'));
  assert(buildSuccess, 'Production build completes and generates dist/index.html');
} catch (err) {
  assert(false, `Production build failed: ${err.message}`);
}

// -------------------------------------------------------------
// FINAL SUMMARY
// -------------------------------------------------------------
console.log('\n=============================================================');
console.log(`EMPIRICAL CHALLENGER VERDICT: ${report.failed === 0 ? 'APPROVE' : 'REQUEST_CHANGES'}`);
console.log(`Passed Assertions: ${report.passed}`);
console.log(`Failed Assertions: ${report.failed}`);
console.log('=============================================================\n');

if (report.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
