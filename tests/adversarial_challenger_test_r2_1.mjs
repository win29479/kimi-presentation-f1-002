/**
 * Adversarial Challenger 1 (Iteration 2)
 * Comprehensive Mutation & Stress Verification Suite
 *
 * Verifies that the remediated test suite and runner strictly kill:
 *  - Corrupted careerTimeline data (year, required fields, count, age, duplicates)
 *  - Missing, truncated, or corrupted assets (file missing, size <30KB, JPEG SOF0 height, PNG colorType)
 *  - Invalid contrast colors and tokens in tokens.css
 *  - Missing id="root" or entry script in index.html
 *  - Invalid runner CLI arguments (--tier foo, 0, 5, -1)
 *  - Explorer & Auditor mutation suites (5/5 and 6/6 killed)
 *  - Teardown lifecycle finally execution
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve('.');
const TIMELINE_PATH = path.join(ROOT_DIR, 'src', 'data', 'careerTimeline.js');
const TOKENS_PATH = path.join(ROOT_DIR, 'src', 'styles', 'tokens.css');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const ASSETS_DIR = path.join(ROOT_DIR, 'src', 'assets', 'images');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function logPass(msg) {
  totalChecks++;
  passedChecks++;
  console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
}

function logFail(msg) {
  totalChecks++;
  failedChecks++;
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${msg}`);
}

function runCommand(cmd) {
  try {
    const stdout = execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      code: err.status ?? 1,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
    };
  }
}

function testMutation({ name, description, targetFile, mutateFn, runnerArgs = '', expectedErrorPattern }) {
  console.log(`\n>>> Testing Mutation: ${name}`);
  console.log(`    Description: ${description}`);

  let originalContent = null;
  let fileToRestore = targetFile;

  try {
    if (targetFile) {
      if (!fs.existsSync(targetFile)) {
        throw new Error(`Target file does not exist: ${targetFile}`);
      }
      originalContent = fs.readFileSync(targetFile);
      mutateFn();
    }

    const cmd = `node tests/runner.js ${runnerArgs}`.trim();
    const result = runCommand(cmd);

    if (result.code === 0) {
      logFail(`Mutation SURVIVED! Command exited with code 0. Expected failure.`);
      return false;
    }

    const output = `${result.stdout}\n${result.stderr}`;
    if (expectedErrorPattern && !output.match(expectedErrorPattern)) {
      logFail(`Mutation caused exit 1, but output did not match expected pattern: ${expectedErrorPattern}. Output preview: ${output.slice(0, 300)}`);
      return false;
    }

    logPass(`Mutation strictly KILLED with exit code ${result.code} and expected error diagnostics.`);
    return true;
  } finally {
    if (originalContent && fileToRestore) {
      fs.writeFileSync(fileToRestore, originalContent);
      // Verify clean restoration
      const verifyResult = runCommand(`node tests/runner.js ${runnerArgs}`.trim());
      if (verifyResult.code !== 0) {
        console.error(`  \x1b[31m[FATAL]\x1b[0m Restoration failed! Runner still failing after restoring ${fileToRestore}`);
        process.exit(1);
      }
    }
  }
}

console.log('========================================================================');
console.log('   ADVERSARIAL EMPIRICAL CHALLENGER: ITERATION 2 MUTATION MATRIX        ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// Baseline Check
// -----------------------------------------------------------------------------
console.log('>>> 0. Baseline Clean Execution Check');
const baseline = runCommand('node tests/runner.js');
if (baseline.code === 0 && baseline.stdout.includes('117 / 117 PASSED')) {
  logPass('Baseline clean runner passed: 117/117 passed with exit code 0.');
} else {
  logFail(`Baseline clean runner failed with code ${baseline.code}. Output: ${baseline.stdout}`);
  process.exit(1);
}

// -----------------------------------------------------------------------------
// 1. Data Contract Mutations: src/data/careerTimeline.js
// -----------------------------------------------------------------------------
testMutation({
  name: 'M-DATA-1: Corrupted Year in Milestone 1',
  description: 'Change year in Milestone 1 from 2014-2018 to 1990',
  targetFile: TIMELINE_PATH,
  mutateFn: () => {
    let content = fs.readFileSync(TIMELINE_PATH, 'utf8');
    content = content.replace("year: '2014–2018'", "year: '1990'");
    fs.writeFileSync(TIMELINE_PATH, content, 'utf8');
  },
  runnerArgs: '--tier 1',
  expectedErrorPattern: /Expected.*2014|Monotonically/i,
});

testMutation({
  name: 'M-DATA-2: Missing Required Field "category" in Milestone 2',
  description: 'Delete category property from Milestone 2 item',
  targetFile: TIMELINE_PATH,
  mutateFn: () => {
    let content = fs.readFileSync(TIMELINE_PATH, 'utf8');
    content = content.replace("category: 'Karting',", "// category deleted");
    fs.writeFileSync(TIMELINE_PATH, content, 'utf8');
  },
  runnerArgs: '--tier 1',
  expectedErrorPattern: /Expected.*undefined.*to be defined/i,
});

testMutation({
  name: 'M-DATA-3: Corrupted Milestone Count (Truncated to 6)',
  description: 'Comment out Milestone 7 so array length is 6 instead of 7',
  targetFile: TIMELINE_PATH,
  mutateFn: () => {
    let content = fs.readFileSync(TIMELINE_PATH, 'utf8');
    const idx = content.indexOf("id: 'milestone-2026'");
    if (idx !== -1) {
      const prevBrace = content.lastIndexOf('{', idx);
      content = content.slice(0, prevBrace) + '];\nexport default CAREER_MILESTONES;';
      fs.writeFileSync(TIMELINE_PATH, content, 'utf8');
    }
  },
  runnerArgs: '--tier 1',
  expectedErrorPattern: /Expected 6 to be strictly equal to 7/i,
});

testMutation({
  name: 'M-DATA-4: Biological Age Incoherence in Scenario 1.3',
  description: 'Set Milestone 1 age to 35 (older than Milestone 2 age 13)',
  targetFile: TIMELINE_PATH,
  mutateFn: () => {
    let content = fs.readFileSync(TIMELINE_PATH, 'utf8');
    content = content.replace("age: 'Age 8–12'", "age: 'Age 35'");
    fs.writeFileSync(TIMELINE_PATH, content, 'utf8');
  },
  runnerArgs: '--tier 4',
  expectedErrorPattern: /Age progression|Expected.*to be/i,
});

testMutation({
  name: 'M-DATA-5: Duplicated Image Across Milestones',
  description: 'Milestone 2 reuses milestone 1 image file',
  targetFile: TIMELINE_PATH,
  mutateFn: () => {
    let content = fs.readFileSync(TIMELINE_PATH, 'utf8');
    content = content.replace(
      "imageFile: 'kimi-karting-rosberg-2018.jpg'",
      "imageFile: 'kimi-karting-antonelli-early.png'"
    );
    fs.writeFileSync(TIMELINE_PATH, content, 'utf8');
  },
  runnerArgs: '--tier 3',
  expectedErrorPattern: /Expected 6 to be strictly equal to 7|Zero milestone photos are duplicated/i,
});

// -----------------------------------------------------------------------------
// 2. Asset Integrity Mutations: src/assets/images/
// -----------------------------------------------------------------------------
testMutation({
  name: 'M-ASSET-1: Missing Asset File in src/assets/images/',
  description: 'Temporarily rename kimi-hero-adjusting-collar.png',
  targetFile: path.join(ASSETS_DIR, 'kimi-hero-adjusting-collar.png'),
  mutateFn: () => {
    const orig = path.join(ASSETS_DIR, 'kimi-hero-adjusting-collar.png');
    const temp = path.join(ASSETS_DIR, 'kimi-hero-adjusting-collar.png.temp_renamed');
    fs.renameSync(orig, temp);
  },
  runnerArgs: '--tier 1',
  expectedErrorPattern: /Expected false to be true|Asset directory exists and contains all 12/i,
});
// Need to restore temp_renamed if testMutation didn't handle rename
if (fs.existsSync(path.join(ASSETS_DIR, 'kimi-hero-adjusting-collar.png.temp_renamed'))) {
  fs.renameSync(
    path.join(ASSETS_DIR, 'kimi-hero-adjusting-collar.png.temp_renamed'),
    path.join(ASSETS_DIR, 'kimi-hero-adjusting-collar.png')
  );
}

testMutation({
  name: 'M-ASSET-2: Truncated Image File (<30 KB)',
  description: 'Truncate kimi-cockpit-helmet-mercedes.jpg to 12 bytes',
  targetFile: path.join(ASSETS_DIR, 'kimi-cockpit-helmet-mercedes.jpg'),
  mutateFn: () => {
    fs.writeFileSync(path.join(ASSETS_DIR, 'kimi-cockpit-helmet-mercedes.jpg'), Buffer.from('corrupt_data'));
  },
  runnerArgs: '--tier 1',
  expectedErrorPattern: /Expected 12 to be > 30000|Fallback default visual/i,
});

testMutation({
  name: 'M-ASSET-3: Mutated JPEG SOF0 Height in kimi-frmec-falcone-thumbsup.jpg',
  description: 'Change binary height from 576 to 999 in JPEG SOF0 segment',
  targetFile: path.join(ASSETS_DIR, 'kimi-frmec-falcone-thumbsup.jpg'),
  mutateFn: () => {
    const buf = fs.readFileSync(path.join(ASSETS_DIR, 'kimi-frmec-falcone-thumbsup.jpg'));
    const mutated = Buffer.from(buf);
    let offset = 2;
    while (offset < mutated.length) {
      if (mutated[offset] !== 0xFF) break;
      const marker = mutated[offset + 1];
      if (marker === 0xC0 || marker === 0xC2) {
        mutated.writeUInt16BE(999, offset + 5);
        break;
      }
      offset += 2 + mutated.readUInt16BE(offset + 2);
    }
    fs.writeFileSync(path.join(ASSETS_DIR, 'kimi-frmec-falcone-thumbsup.jpg'), mutated);
  },
  runnerArgs: '--tier 2',
  expectedErrorPattern: /Expected 999 to be strictly equal to 576/i,
});

testMutation({
  name: 'M-ASSET-4: Mutated PNG ColorType in kimi-mercedes-portrait-official.png',
  description: 'Change PNG ColorType from 6 (RGBA) to 2 (RGB without alpha)',
  targetFile: path.join(ASSETS_DIR, 'kimi-mercedes-portrait-official.png'),
  mutateFn: () => {
    const buf = fs.readFileSync(path.join(ASSETS_DIR, 'kimi-mercedes-portrait-official.png'));
    const mutated = Buffer.from(buf);
    mutated.writeUInt8(2, 25); // offset 25 is ColorType
    fs.writeFileSync(path.join(ASSETS_DIR, 'kimi-mercedes-portrait-official.png'), mutated);
  },
  runnerArgs: '--tier 2',
  expectedErrorPattern: /Expected 2 to be strictly equal to 6/i,
});

testMutation({
  name: 'M-ASSET-5: Reintroduced Legacy AI Marker in src/',
  description: 'Add AI_PORTRAIT_DATA_URL string into src/styles/tokens.css',
  targetFile: TOKENS_PATH,
  mutateFn: () => {
    let content = fs.readFileSync(TOKENS_PATH, 'utf8');
    content += '\n/* AI_PORTRAIT_DATA_URL = "data:image/png;base64,bad" */\n';
    fs.writeFileSync(TOKENS_PATH, content, 'utf8');
  },
  runnerArgs: '--tier 2',
  expectedErrorPattern: /AI_PORTRAIT_DATA_URL/i,
});

// -----------------------------------------------------------------------------
// 3. CSS Tokens & Contrast Mutations: src/styles/tokens.css
// -----------------------------------------------------------------------------
testMutation({
  name: 'M-TOKEN-1: Invalid WCAG AAA Contrast for Pure White on Dark Carbon',
  description: 'Change --pure-white from #FFFFFF to #1A1A1A (low contrast dark gray)',
  targetFile: TOKENS_PATH,
  mutateFn: () => {
    let content = fs.readFileSync(TOKENS_PATH, 'utf8');
    content = content.replace('--pure-white: #FFFFFF;', '--pure-white: #1A1A1A;');
    fs.writeFileSync(TOKENS_PATH, content, 'utf8');
  },
  runnerArgs: '--tier 3',
  expectedErrorPattern: /Contrast ratio of pureWhite text on bgDeepCarbon background exceeds WCAG AAA/i,
});

testMutation({
  name: 'M-TOKEN-2: Invalid WCAG AA Contrast for Mercedes Cyan on Dark Carbon',
  description: 'Change --mercedes-cyan from #00F5D4 to #002222 (low contrast dark teal)',
  targetFile: TOKENS_PATH,
  mutateFn: () => {
    let content = fs.readFileSync(TOKENS_PATH, 'utf8');
    content = content.replace('--mercedes-cyan: #00F5D4;', '--mercedes-cyan: #002222;');
    fs.writeFileSync(TOKENS_PATH, content, 'utf8');
  },
  runnerArgs: '--tier 3',
  expectedErrorPattern: /Contrast ratio of mercedesCyan on bgDeepCarbon background exceeds WCAG AA/i,
});

testMutation({
  name: 'M-TOKEN-3: Mutated Timeline Central Spine Token',
  description: 'Change --timeline-spine-center from 50% to 20%',
  targetFile: TOKENS_PATH,
  mutateFn: () => {
    let content = fs.readFileSync(TOKENS_PATH, 'utf8');
    content = content.replace('--timeline-spine-center: 50%;', '--timeline-spine-center: 20%;');
    fs.writeFileSync(TOKENS_PATH, content, 'utf8');
  },
  runnerArgs: '--tier 1',
  expectedErrorPattern: /--timeline-spine-center: 50%/i,
});

// -----------------------------------------------------------------------------
// 4. DOM & Root Mount Mutations: index.html
// -----------------------------------------------------------------------------
testMutation({
  name: 'M-DOM-1: Missing Root Mounting Container (id="root")',
  description: 'Change id="root" to id="not-root" in index.html',
  targetFile: INDEX_HTML_PATH,
  mutateFn: () => {
    let content = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
    content = content.replace('id="root"', 'id="not-root"');
    fs.writeFileSync(INDEX_HTML_PATH, content, 'utf8');
  },
  runnerArgs: '--tier 1',
  expectedErrorPattern: /Expected.*to contain "id=\\"root\\""|id=\["'\]root\["'\]/i,
});

testMutation({
  name: 'M-DOM-2: Missing Entry Module Script in index.html',
  description: 'Remove <script type="module" src="/src/main.jsx"></script>',
  targetFile: INDEX_HTML_PATH,
  mutateFn: () => {
    let content = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
    content = content.replace('<script type="module" src="/src/main.jsx"></script>', '<!-- script removed -->');
    fs.writeFileSync(INDEX_HTML_PATH, content, 'utf8');
  },
  runnerArgs: '--tier 1',
  expectedErrorPattern: /Expected.*to match.*main\.jsx/i,
});

// -----------------------------------------------------------------------------
// 5. Runner CLI Validation Checks
// -----------------------------------------------------------------------------
console.log('\n>>> 5. Test Runner CLI Argument Validation');

const cliChecks = [
  { arg: '--tier foo', expectedPattern: /Invalid tier specified: NaN/ },
  { arg: '--tier 0', expectedPattern: /Invalid tier specified: 0/ },
  { arg: '--tier 5', expectedPattern: /Invalid tier specified: 5/ },
  { arg: '--tier -1', expectedPattern: /Invalid tier specified: -1/ },
  { arg: '--tier=foo', expectedPattern: /Invalid tier specified: NaN/ },
  { arg: '--tier=0', expectedPattern: /Invalid tier specified: 0/ },
  { arg: '--tier=5', expectedPattern: /Invalid tier specified: 5/ },
];

for (const check of cliChecks) {
  const res = runCommand(`node tests/runner.js ${check.arg}`);
  if (res.code === 1 && res.stdout.match(check.expectedPattern)) {
    logPass(`CLI flag ${check.arg} exited code 1 with: ${res.stdout.trim()}`);
  } else {
    logFail(`CLI flag ${check.arg} failed validation: code=${res.code}, output=${res.stdout}`);
  }
}

// -----------------------------------------------------------------------------
// 6. External Mutation Suites Execution
// -----------------------------------------------------------------------------
console.log('\n>>> 6. External Mutation Suites Execution');

const explorerMutation = runCommand('node .agents/teamwork/explorer_test_r2_2/mutation_test.mjs');
if (explorerMutation.code === 0 && explorerMutation.stdout.includes('Killed = 5, Survived = 0')) {
  logPass('Explorer 2 mutation suite: 5/5 mutations killed.');
} else {
  logFail(`Explorer 2 mutation suite failed: ${explorerMutation.stdout}`);
}

const auditorMutation = runCommand('node .agents/teamwork/auditor_test_1/mutation_audit.mjs');
if (auditorMutation.code === 0 && auditorMutation.stdout.includes('Caught: 6 / 6')) {
  logPass('Auditor 1 mutation suite: 6/6 mutations caught.');
} else {
  logFail(`Auditor 1 mutation suite failed: ${auditorMutation.stdout}`);
}

// -----------------------------------------------------------------------------
// 7. Teardown Lifecycle Guarantee in tests/runner.js
// -----------------------------------------------------------------------------
console.log('\n>>> 7. Teardown Lifecycle Invariant Verification');
import { describe as dRunner, it as iRunner, afterEach as aRunner, run as rRunner } from './runner.js';

let teardownExecuted = false;
dRunner('Teardown Invariant Verification Suite', () => {
  aRunner(() => {
    teardownExecuted = true;
  });
  iRunner('Intentionally failing test to test afterEach execution', () => {
    throw new Error('Forced error inside test to verify afterEach finally block');
  });
});

const suitePromise = rRunner();
suitePromise.then((summary) => {
  if (teardownExecuted) {
    logPass('Teardown hook (afterEach) was strictly executed in finally block despite test exception.');
  } else {
    logFail('Teardown hook was bypassed when test threw!');
  }

  // -----------------------------------------------------------------------------
  // Final Grand Summary
  // -----------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('   ADVERSARIAL EMPIRICAL CHALLENGER: SUMMARY RESULTS                    ');
  console.log('========================================================================');
  console.log(`  Total Checks:   ${totalChecks}`);
  console.log(`  Passed Checks:  ${passedChecks}`);
  console.log(`  Failed Checks:  ${failedChecks}`);
  console.log('------------------------------------------------------------------------');

  if (failedChecks === 0) {
    console.log('  >>> EMPIRICAL CHALLENGER VERDICT: APPROVE <<<');
    console.log('========================================================================\n');
    process.exit(0);
  } else {
    console.error('  >>> EMPIRICAL CHALLENGER VERDICT: REQUEST_CHANGES <<<');
    console.log('========================================================================\n');
    process.exit(1);
  }
}).catch((err) => {
  console.error('Unexpected runner error:', err);
  process.exit(1);
});
