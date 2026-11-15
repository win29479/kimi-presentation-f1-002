import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SOURCE_DIR = 'C:/Users/PC/.gemini/antigravity/brain/c09273cb-e6bd-453b-9f8f-51c2d663e391/.user_uploaded';

console.log('========================================================================');
console.log('       ADVERSARIAL EMPIRICAL CHALLENGER: MILESTONE 1 (M1-GEN2)          ');
console.log('========================================================================\n');

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
    console.error(`  [FAIL] [${category}] ${description}`, details || '');
  }
}

function sha256File(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// -----------------------------------------------------------------------------
// 1. ASSET PARITY & BYTE CHECKSUMS (Source vs Ingested)
// -----------------------------------------------------------------------------
console.log('\n>>> 1. Verifying Source Asset Parity, Byte Lengths, and SHA256 Checksums');

const TARGET_ASSET_MAPPINGS = [
  {
    key: 'heroCollar',
    sourceFile: 'media_1794759077481_90e658ac.png',
    destFile: 'kimi-hero-adjusting-collar.png',
    expectedSize: 302396,
    expectedWidth: 666,
    expectedHeight: 375,
    hasAlpha: true
  },
  {
    key: 'champion2026',
    sourceFile: 'media_1794759077475_9d3c6b28.jpg',
    destFile: 'kimi-2026-world-champion-stamp.jpg',
    expectedSize: 219607,
    expectedWidth: 803,
    expectedHeight: 1024,
    hasAlpha: false
  },
  {
    key: 'kartingRosberg',
    sourceFile: 'media_1794759266685_c04a8290.jpg',
    destFile: 'kimi-karting-rosberg-2018.jpg',
    expectedSize: 54782,
    expectedWidth: 387,
    expectedHeight: 516,
    hasAlpha: false
  },
  {
    key: 'journeySideBySide',
    sourceFile: 'media_1794759287239_587fcb8f.jpg',
    destFile: 'kimi-journey-kart-to-f1.jpg',
    expectedSize: 54393,
    expectedWidth: 399,
    expectedHeight: 501,
    hasAlpha: false
  },
  {
    key: 'kartingEarly',
    sourceFile: 'media_1794759325583_6ce10f48.png',
    destFile: 'kimi-karting-antonelli-early.png',
    expectedSize: 93583,
    expectedWidth: 201,
    expectedHeight: 251,
    hasAlpha: true
  },
  {
    key: 'f4Champion2022',
    sourceFile: 'media_1794759346353_3c70a87b.jpg',
    destFile: 'kimi-f4-champion-2022.jpg',
    expectedSize: 47735,
    expectedWidth: 547,
    expectedHeight: 365,
    hasAlpha: false
  },
  {
    key: 'frecaPrema2023',
    sourceFile: 'media_1794759430135_e6c7d6e8.jpg',
    destFile: 'kimi-freca-prema-2023.jpg',
    expectedSize: 41280,
    expectedWidth: 404,
    expectedHeight: 495,
    hasAlpha: false
  },
  {
    key: 'frmecFalcone',
    sourceFile: 'media_1794759474584_5db7865a.jpg',
    destFile: 'kimi-frmec-falcone-thumbsup.jpg',
    expectedSize: 217484,
    expectedWidth: 1024,
    expectedHeight: 576,
    hasAlpha: false
  },
  {
    key: 'cockpitHelmet',
    sourceFile: 'media_1794759555072_b6f015f4.jpg',
    destFile: 'kimi-cockpit-helmet-mercedes.jpg',
    expectedSize: 60958,
    expectedWidth: 599,
    expectedHeight: 399,
    hasAlpha: false
  },
  {
    key: 'portraitOfficial',
    sourceFile: 'media_1794759564452_83fa04f2.png',
    destFile: 'kimi-mercedes-portrait-official.png',
    expectedSize: 209766,
    expectedWidth: 440,
    expectedHeight: 440,
    hasAlpha: true
  },
  {
    key: 'paddockIntense',
    sourceFile: 'media_1794759573806_d4530a75.jpg',
    destFile: 'kimi-mercedes-paddock-intense.jpg',
    expectedSize: 80934,
    expectedWidth: 1024,
    expectedHeight: 576,
    hasAlpha: false
  },
  {
    key: 'f2Smiling2024',
    sourceFile: 'media_1794759580109_e13c379d.jpg',
    destFile: 'kimi-f2-prema-smiling-2024.jpg',
    expectedSize: 51748,
    expectedWidth: 800,
    expectedHeight: 600,
    hasAlpha: false
  }
];

const destDir = path.join(rootDir, 'src', 'assets', 'images');

for (const item of TARGET_ASSET_MAPPINGS) {
  const srcPath = path.join(SOURCE_DIR, item.sourceFile);
  const dstPath = path.join(destDir, item.destFile);

  assert('PARITY', fs.existsSync(srcPath), `Source file ${item.sourceFile} exists`);
  assert('PARITY', fs.existsSync(dstPath), `Destination file ${item.destFile} exists`);

  if (fs.existsSync(srcPath) && fs.existsSync(dstPath)) {
    const srcSize = fs.statSync(srcPath).size;
    const dstSize = fs.statSync(dstPath).size;
    assert('PARITY', srcSize === item.expectedSize, `${item.sourceFile} size matches expected (${srcSize} == ${item.expectedSize})`);
    assert('PARITY', dstSize === item.expectedSize, `${item.destFile} size matches expected (${dstSize} == ${item.expectedSize})`);

    const srcHash = sha256File(srcPath);
    const dstHash = sha256File(dstPath);
    assert('PARITY', srcHash === dstHash, `${item.destFile} SHA256 matches source ${item.sourceFile} exactly (${srcHash.slice(0, 16)}...)`);
  }
}

// -----------------------------------------------------------------------------
// 2. NON-TARGET FILE EXCLUSION
// -----------------------------------------------------------------------------
console.log('\n>>> 2. Verifying Non-Target Files Exclusion');

const NON_TARGET_FILES = [
  'media_1794429168298_fc1497cc.png',
  'media_1794431177172_6ab418ac.mp4'
];

const nonTargetHashes = [];
for (const ntf of NON_TARGET_FILES) {
  const p = path.join(SOURCE_DIR, ntf);
  if (fs.existsSync(p)) {
    nonTargetHashes.push({ name: ntf, hash: sha256File(p), size: fs.statSync(p).size });
  }
}

function recursiveFileList(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(recursiveFileList(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const allProjectFiles = [
  ...recursiveFileList(path.join(rootDir, 'src')),
  ...recursiveFileList(path.join(rootDir, 'public'))
];

for (const ntf of NON_TARGET_FILES) {
  const foundByName = allProjectFiles.filter(f => path.basename(f) === ntf);
  assert('EXCLUSION', foundByName.length === 0, `Non-target file ${ntf} must not be present anywhere in src/ or public/`);
}

for (const nth of nonTargetHashes) {
  for (const f of allProjectFiles) {
    if (fs.statSync(f).size === nth.size) {
      const fHash = sha256File(f);
      assert('EXCLUSION', fHash !== nth.hash, `File ${path.relative(rootDir, f)} must not match non-target ${nth.name} hash`);
    }
  }
}

// -----------------------------------------------------------------------------
// 3. IMAGE FORMAT INTEGRITY, HEADERS, DIMENSIONS, ALPHA, ASPECT RATIO
// -----------------------------------------------------------------------------
console.log('\n>>> 3. Verifying Binary Image Headers, Aspect Ratios, and Magic Bytes');

function parsePng(buf) {
  // Magic bytes: 89 50 4E 47 0D 0A 1A 0A
  if (buf.length < 33) throw new Error('File too short to be PNG');
  const magic = buf.slice(0, 8);
  const expectedMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!magic.equals(expectedMagic)) throw new Error('Invalid PNG magic bytes');

  // IHDR chunk
  const ihdrLen = buf.readUInt32BE(8);
  const ihdrType = buf.toString('ascii', 12, 16);
  if (ihdrLen !== 13 || ihdrType !== 'IHDR') throw new Error('Invalid IHDR chunk');

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf.readUInt8(24);
  const colorType = buf.readUInt8(25);

  // Check IEND at end
  const tail = buf.slice(buf.length - 12);
  const iendType = tail.toString('ascii', 4, 8);
  if (iendType !== 'IEND') throw new Error('Missing or corrupt PNG IEND chunk');

  const hasAlpha = colorType === 4 || colorType === 6;
  return { width, height, bitDepth, colorType, hasAlpha, format: 'PNG' };
}

function parseJpeg(buf) {
  if (buf.length < 4) throw new Error('File too short to be JPEG');
  // SOI: FF D8
  if (buf.readUInt16BE(0) !== 0xFFD8) throw new Error('Invalid JPEG SOI marker');

  // EOI: FF D9 at end
  if (buf.readUInt16BE(buf.length - 2) !== 0xFFD9) throw new Error('Invalid JPEG EOI marker');

  let offset = 2;
  while (offset < buf.length - 4) {
    const marker = buf.readUInt16BE(offset);
    offset += 2;
    if (marker >= 0xFFC0 && marker <= 0xFFCF && marker !== 0xFFC4 && marker !== 0xFFC8 && marker !== 0xFFCC) {
      // SOF marker
      const len = buf.readUInt16BE(offset);
      const precision = buf.readUInt8(offset + 2);
      const height = buf.readUInt16BE(offset + 3);
      const width = buf.readUInt16BE(offset + 5);
      const components = buf.readUInt8(offset + 7);
      return { width, height, precision, components, hasAlpha: false, format: 'JPEG' };
    }
    const len = buf.readUInt16BE(offset);
    offset += len;
  }
  throw new Error('No SOF marker found in JPEG');
}

for (const item of TARGET_ASSET_MAPPINGS) {
  const p = path.join(destDir, item.destFile);
  const buf = fs.readFileSync(p);

  try {
    let meta;
    if (item.destFile.endsWith('.png')) {
      meta = parsePng(buf);
    } else {
      meta = parseJpeg(buf);
    }

    assert('FORMAT', meta.width === item.expectedWidth, `${item.destFile} width ${meta.width} == ${item.expectedWidth}`);
    assert('FORMAT', meta.height === item.expectedHeight, `${item.destFile} height ${meta.height} == ${item.expectedHeight}`);
    assert('FORMAT', meta.hasAlpha === item.hasAlpha, `${item.destFile} alpha flag ${meta.hasAlpha} == ${item.hasAlpha}`);

    const aspectRatio = (meta.width / meta.height).toFixed(3);
    const expectedRatio = (item.expectedWidth / item.expectedHeight).toFixed(3);
    assert('FORMAT', aspectRatio === expectedRatio, `${item.destFile} aspect ratio ${aspectRatio} matches expected ${expectedRatio}`);
  } catch (err) {
    assert('FORMAT', false, `Failed to parse ${item.destFile}: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// 4. SCAN SOURCE FOR BASE64 AI IMAGES & PLACEHOLDERS
// -----------------------------------------------------------------------------
console.log('\n>>> 4. Scanning src/ and public/ for Legacy AI Data URLs and Placeholder Text');

const srcFiles = recursiveFileList(path.join(rootDir, 'src'));

for (const file of srcFiles) {
  const ext = path.extname(file).toLowerCase();
  if (['.js', '.jsx', '.css', '.html', '.json', '.svg'].includes(ext)) {
    const content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(rootDir, file);

    const hasDataImage = content.includes('data:image/');
    assert('PURGE', !hasDataImage, `${relPath} contains zero 'data:image/' references`);

    const hasBase64 = content.includes('base64,');
    assert('PURGE', !hasBase64, `${relPath} contains zero 'base64,' strings`);

    // Check for suspicious unresolved placeholders
    const suspiciousPatterns = [
      /lorem\s+ipsum/i,
      /\bFIXME\b/,
      /\bTBD\b/,
      /placeholder\.com/i,
      /via\.placeholder/i,
      /unsplash\.com/i
    ];

    for (const pat of suspiciousPatterns) {
      assert('PURGE', !pat.test(content), `${relPath} does not match suspicious placeholder pattern ${pat}`);
    }
  }
}

// -----------------------------------------------------------------------------
// 5. IMPORT RESOLUTION & CIRCULAR DEPENDENCY DETECTION
// -----------------------------------------------------------------------------
console.log('\n>>> 5. Analyzing Import Graph and Detecting Circular Dependencies');

const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"](\.[^'"]+)['"]/g;

const moduleGraph = new Map();

for (const file of srcFiles) {
  const ext = path.extname(file).toLowerCase();
  if (['.js', '.jsx'].includes(ext)) {
    const content = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(rootDir, file).replace(/\\/g, '/');
    const imports = [];

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importTarget = match[1];
      const dir = path.dirname(file);
      let resolved = path.resolve(dir, importTarget);

      // Check extensions if not specified
      if (!fs.existsSync(resolved)) {
        if (fs.existsSync(resolved + '.js')) resolved += '.js';
        else if (fs.existsSync(resolved + '.jsx')) resolved += '.jsx';
        else if (fs.existsSync(path.join(resolved, 'index.js'))) resolved = path.join(resolved, 'index.js');
        else if (fs.existsSync(path.join(resolved, 'index.jsx'))) resolved = path.join(resolved, 'index.jsx');
      }

      assert('IMPORTS', fs.existsSync(resolved), `Import "${importTarget}" in ${relFile} resolves to existing file on disk`);

      const relResolved = path.relative(rootDir, resolved).replace(/\\/g, '/');
      imports.push(relResolved);
    }

    moduleGraph.set(relFile, imports);
  }
}

// Cycle Detection using DFS
function detectCycles(graph) {
  const visited = new Set();
  const recStack = new Set();
  const cycles = [];

  function dfs(node, pathArr) {
    visited.add(node);
    recStack.add(node);
    pathArr.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...pathArr]);
      } else if (recStack.has(neighbor)) {
        const cycleStartIndex = pathArr.indexOf(neighbor);
        cycles.push(pathArr.slice(cycleStartIndex).concat(neighbor));
      }
    }

    recStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

const detectedCycles = detectCycles(moduleGraph);
assert('IMPORTS', detectedCycles.length === 0, `Dependency graph is strictly acyclic (0 circular dependencies found)`, detectedCycles);

// -----------------------------------------------------------------------------
// 6. PRODUCTION BUILD EXECUTION & DIST INTEGRITY
// -----------------------------------------------------------------------------
console.log('\n>>> 6. Executing Production Build (npm run build) and Verifying dist/');

const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

let buildExitCode = 0;
let buildStdout = '';
const startTime = Date.now();

try {
  buildStdout = execSync('npm run build', {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  console.log(`  Build output:\n${buildStdout.trim().split('\n').map(l => '    ' + l).join('\n')}`);
} catch (err) {
  buildExitCode = err.status || 1;
  console.error(`  Build error:\n${err.stderr || err.message}`);
}
const buildDuration = Date.now() - startTime;

assert('BUILD', buildExitCode === 0, `Production build exits with code 0 (took ${buildDuration}ms)`);
assert('BUILD', fs.existsSync(distDir), `Directory dist/ was created`);
assert('BUILD', fs.existsSync(path.join(distDir, 'index.html')), `dist/index.html exists`);

// Verify dist/index.html references
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  const distHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

  // Extract scripts & stylesheets
  const scriptMatches = [...distHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
  const cssMatches = [...distHtml.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/g)].map(m => m[1]);

  assert('BUILD', scriptMatches.length > 0, `dist/index.html includes at least one <script> entry`);
  assert('BUILD', cssMatches.length > 0, `dist/index.html includes at least one stylesheet <link> entry`);

  for (const src of scriptMatches) {
    const cleanSrc = src.replace(/^\//, '');
    const fullP = path.join(distDir, cleanSrc);
    assert('BUILD', fs.existsSync(fullP), `Bundled script ${cleanSrc} exists on disk in dist/`);
    if (fs.existsSync(fullP)) {
      assert('BUILD', fs.statSync(fullP).size > 0, `Bundled script ${cleanSrc} has non-zero size`);
    }
  }

  for (const href of cssMatches) {
    const cleanHref = href.replace(/^\//, '');
    const fullP = path.join(distDir, cleanHref);
    assert('BUILD', fs.existsSync(fullP), `Bundled stylesheet ${cleanHref} exists on disk in dist/`);
    if (fs.existsSync(fullP)) {
      assert('BUILD', fs.statSync(fullP).size > 0, `Bundled stylesheet ${cleanHref} has non-zero size`);
    }
  }
}

// Verify that all 12 images are emitted into dist/assets/
const distAssetsDir = path.join(distDir, 'assets');
assert('BUILD', fs.existsSync(distAssetsDir), `dist/assets/ exists`);

if (fs.existsSync(distAssetsDir)) {
  const distAssets = fs.readdirSync(distAssetsDir);
  console.log(`  Emitted assets count: ${distAssets.length}`);

  for (const item of TARGET_ASSET_MAPPINGS) {
    const prefix = path.basename(item.destFile, path.extname(item.destFile));
    const ext = path.extname(item.destFile);
    // Find matching emitted asset
    const matched = distAssets.find(f => f.startsWith(prefix) && f.endsWith(ext));
    assert('BUILD', !!matched, `Asset ${item.destFile} emitted into dist/assets/ as ${matched || 'NOT FOUND'}`);

    if (matched) {
      const emittedPath = path.join(distAssetsDir, matched);
      const emittedSize = fs.statSync(emittedPath).size;
      assert('BUILD', emittedSize === item.expectedSize, `Emitted ${matched} size ${emittedSize} matches original ${item.expectedSize}`);
      const emittedHash = sha256File(emittedPath);
      const srcHash = sha256File(path.join(SOURCE_DIR, item.sourceFile));
      assert('BUILD', emittedHash === srcHash, `Emitted ${matched} SHA256 matches authentic source`);
    }
  }
}

// -----------------------------------------------------------------------------
// 7. BUNDLE SIZE BUDGET & GZIP METRICS
// -----------------------------------------------------------------------------
console.log('\n>>> 7. Evaluating Bundle Budgets, JS/CSS Gzip Compression Metrics');

if (fs.existsSync(distAssetsDir)) {
  const distFiles = fs.readdirSync(distAssetsDir);
  const jsFiles = distFiles.filter(f => f.endsWith('.js'));
  const cssFiles = distFiles.filter(f => f.endsWith('.css'));

  let totalJsRaw = 0;
  let totalJsGzip = 0;

  for (const js of jsFiles) {
    const fullP = path.join(distAssetsDir, js);
    const raw = fs.readFileSync(fullP);
    const gzipped = zlib.gzipSync(raw);
    totalJsRaw += raw.length;
    totalJsGzip += gzipped.length;

    const rawKb = (raw.length / 1024).toFixed(2);
    const gzipKb = (gzipped.length / 1024).toFixed(2);
    console.log(`  JS Chunk: ${js} | Raw: ${rawKb} KB | Gzip: ${gzipKb} KB`);

    assert('BUDGET', gzipped.length < 500 * 1024, `JS chunk ${js} gzipped (${gzipKb} KB) is strictly < 500 KB`);
  }

  assert('BUDGET', totalJsGzip < 500 * 1024, `Total JS gzipped (${(totalJsGzip / 1024).toFixed(2)} KB) is strictly < 500 KB budget`);

  for (const css of cssFiles) {
    const fullP = path.join(distAssetsDir, css);
    const raw = fs.readFileSync(fullP);
    const gzipped = zlib.gzipSync(raw);
    const rawKb = (raw.length / 1024).toFixed(2);
    const gzipKb = (gzipped.length / 1024).toFixed(2);
    console.log(`  CSS Chunk: ${css} | Raw: ${rawKb} KB | Gzip: ${gzipKb} KB`);
    assert('BUDGET', gzipped.length < 50 * 1024, `CSS chunk ${css} gzipped (${gzipKb} KB) is strictly < 50 KB budget`);
  }
}

// -----------------------------------------------------------------------------
// 8. RUN INDEPENDENT E2E TEST RUNNER (npm test)
// -----------------------------------------------------------------------------
console.log('\n>>> 8. Running Independent E2E Test Suite (npm test)');

let testExitCode = 0;
let testStdout = '';
try {
  testStdout = execSync('npm test', {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  console.log(`  Test Runner output summary:\n${testStdout.trim().split('\n').filter(l => l.includes('PASSED') || l.includes('TOTAL') || l.includes('Passed:') || l.includes('All')).map(l => '    ' + l).join('\n')}`);
} catch (err) {
  testExitCode = err.status || 1;
  console.error(`  Test Runner error:\n${err.stderr || err.message}`);
}

assert('TESTS', testExitCode === 0, `E2E Test Runner exits with code 0`);
assert('TESTS', testStdout.includes('All 117 tests passed successfully!'), `Runner reports 117/117 tests passed`);

// -----------------------------------------------------------------------------
// FINAL VERDICT & REPORT SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL ASSERTIONS: ${suite.total}`);
console.log(`PASSED: ${suite.passed}`);
console.log(`FAILED: ${suite.failed}`);
for (const [cat, data] of Object.entries(suite.categories)) {
  console.log(`  - [${cat}]: ${data.passed}/${data.total} passed (${data.failed} failed)`);
}

const verdict = suite.failed === 0 ? 'APPROVE' : 'REJECT';
console.log(`\n>>> EMPIRICAL CHALLENGER VERDICT: ${verdict} <<<`);
console.log('========================================================================\n');

if (suite.failed > 0) {
  console.error('Failure Details:', JSON.stringify(suite.failures, null, 2));
  process.exit(1);
} else {
  process.exit(0);
}
