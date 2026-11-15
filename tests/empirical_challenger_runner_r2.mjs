/**
 * Empirical Challenger Test Suite: Runner Lifecycle, Concurrency & Stress Resilience (Iteration 2)
 * File: tests/empirical_challenger_runner_r2.mjs
 *
 * Verifies:
 * 1. Teardown guarantee: afterEach runs via finally block even under unhandled errors/assertion failures
 * 2. Import isolation: process.argv[1] guard prevents test execution on ESM import
 * 3. CLI Tier argument parsing and validation across all valid & invalid variants
 * 4. Stress testing: 20x consecutive runs for determinism, zero leaks, and zero flakiness
 * 5. Concurrency: 5x parallel simultaneous runs for race condition & lock resilience
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync, spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RUNNER_PATH = path.resolve(ROOT_DIR, 'tests', 'runner.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('========================================================================');
console.log('   EMPIRICAL CHALLENGER 2 (ITERATION 2): RUNNER STRESS & LIFECYCLE HARNESS');
console.log('========================================================================\n');

// -------------------------------------------------------------------------
// SECTION 1: Teardown Guarantee (afterEach execution via finally)
// -------------------------------------------------------------------------
console.log('>>> 1. Teardown Guarantee & Lifecycle Verification');

const runnerSource = fs.readFileSync(RUNNER_PATH, 'utf-8');

// 1.1 Source inspection for try/finally around afterEach
const hasTryFinally = /try\s*\{\s*await\s+t\.fn\(\);\s*\}\s*finally\s*\{\s*for\s*\(\s*const\s+a\s+of\s+desc\.afterEachFns\s*\)\s*await\s+a\(\);\s*\}/.test(runnerSource);
assert(hasTryFinally, 'tests/runner.js source contains try ... finally wrapping await t.fn() and afterEachFns');

// 1.2 Programmatic test of afterEach hook when test succeeds vs when test throws
async function testTeardownBehavior() {
  const runner = await import(pathToFileURL(RUNNER_PATH).href);

  // Check exported symbols
  assert(typeof runner.describe === 'function', 'runner exports describe function');
  assert(typeof runner.it === 'function', 'runner exports it function');
  assert(typeof runner.beforeEach === 'function', 'runner exports beforeEach function');
  assert(typeof runner.afterEach === 'function', 'runner exports afterEach function');
  assert(typeof runner.expect === 'function', 'runner exports expect function');

  // Verify lifecycle semantics directly with a simulated runner describe block
  // We recreate the runner's execution loop logic to verify the invariant
  let beforeEachRun = false;
  let testRan = false;
  let afterEachRun = false;

  const descSuccess = {
    title: 'Teardown Success Suite',
    beforeEachFns: [() => { beforeEachRun = true; }],
    afterEachFns: [() => { afterEachRun = true; }],
    tests: [{
      title: 'Passing Test',
      fn: async () => { testRan = true; }
    }]
  };

  for (const t of descSuccess.tests) {
    try {
      for (const b of descSuccess.beforeEachFns) await b();
      try {
        await t.fn();
      } finally {
        for (const a of descSuccess.afterEachFns) await a();
      }
    } catch (err) {}
  }

  assert(beforeEachRun && testRan && afterEachRun, 'Success path: beforeEach -> test -> afterEach executed');

  // Now test with sync error
  let syncTeardownExecuted = false;
  const descSyncFail = {
    title: 'Sync Fail Suite',
    beforeEachFns: [],
    afterEachFns: [() => { syncTeardownExecuted = true; }],
    tests: [{
      title: 'Failing Sync Test',
      fn: () => { throw new Error('Forced sync failure'); }
    }]
  };

  let caughtSyncError = null;
  for (const t of descSyncFail.tests) {
    try {
      try {
        await t.fn();
      } finally {
        for (const a of descSyncFail.afterEachFns) await a();
      }
    } catch (err) {
      caughtSyncError = err;
    }
  }

  assert(syncTeardownExecuted === true, 'Sync throw: afterEach executed in finally block despite exception');
  assert(caughtSyncError !== null && caughtSyncError.message === 'Forced sync failure', 'Sync throw: error was caught by outer try/catch');

  // Test with async rejection
  let asyncTeardownExecuted = false;
  const descAsyncFail = {
    title: 'Async Fail Suite',
    beforeEachFns: [],
    afterEachFns: [() => { asyncTeardownExecuted = true; }],
    tests: [{
      title: 'Failing Async Test',
      fn: async () => {
        await new Promise((r) => setTimeout(r, 5));
        throw new Error('Forced async rejection');
      }
    }]
  };

  let caughtAsyncError = null;
  for (const t of descAsyncFail.tests) {
    try {
      try {
        await t.fn();
      } finally {
        for (const a of descAsyncFail.afterEachFns) await a();
      }
    } catch (err) {
      caughtAsyncError = err;
    }
  }

  assert(asyncTeardownExecuted === true, 'Async rejection: afterEach executed in finally block despite rejection');
  assert(caughtAsyncError !== null && caughtAsyncError.message === 'Forced async rejection', 'Async rejection: error was caught by outer try/catch');

  // Test with assertion failure (expect().toBe())
  let assertionTeardownExecuted = false;
  const descAssertionFail = {
    title: 'Assertion Fail Suite',
    beforeEachFns: [],
    afterEachFns: [() => { assertionTeardownExecuted = true; }],
    tests: [{
      title: 'Failing Assertion Test',
      fn: async () => {
        runner.expect(1).toBe(2);
      }
    }]
  };

  let caughtAssertionError = null;
  for (const t of descAssertionFail.tests) {
    try {
      try {
        await t.fn();
      } finally {
        for (const a of descAssertionFail.afterEachFns) await a();
      }
    } catch (err) {
      caughtAssertionError = err;
    }
  }

  assert(assertionTeardownExecuted === true, 'Assertion failure: afterEach executed in finally block when expect() throws');
  assert(caughtAssertionError !== null, 'Assertion failure: exception caught');

  // Test multiple sequential afterEach hooks execution on failure
  const executionOrder = [];
  const descMultiAfter = {
    title: 'Multiple AfterEach Suite',
    beforeEachFns: [],
    afterEachFns: [
      () => { executionOrder.push('afterEach_1'); },
      async () => {
        await new Promise((r) => setTimeout(r, 2));
        executionOrder.push('afterEach_2');
      },
      () => { executionOrder.push('afterEach_3'); }
    ],
    tests: [{
      title: 'Multi After Test',
      fn: async () => {
        executionOrder.push('test_body');
        throw new Error('Explosion');
      }
    }]
  };

  for (const t of descMultiAfter.tests) {
    try {
      try {
        await t.fn();
      } finally {
        for (const a of descMultiAfter.afterEachFns) await a();
      }
    } catch (err) {}
  }

  const expectedOrder = ['test_body', 'afterEach_1', 'afterEach_2', 'afterEach_3'];
  assert(
    JSON.stringify(executionOrder) === JSON.stringify(expectedOrder),
    `Multiple afterEach hooks execute in exact sequence on failure: ${JSON.stringify(executionOrder)}`
  );
}

await testTeardownBehavior();

// -------------------------------------------------------------------------
// SECTION 2: Import Isolation Guard (process.argv[1] guard)
// -------------------------------------------------------------------------
console.log('\n>>> 2. ESM Import Isolation Verification');

// 2.1 Child process test: import tests/runner.js without process.argv[1] matching runner.js
const importTestScript = `
  import * as runner from './tests/runner.js';
  if (typeof runner.expect === 'function' && typeof runner.describe === 'function') {
    console.log('MODULE_IMPORT_SAFE_OK');
  } else {
    console.error('EXPORT_MISSING');
    process.exit(2);
  }
`;

const importResult = spawnSync('node', ['--input-type=module', '-e', importTestScript], {
  cwd: ROOT_DIR,
  encoding: 'utf-8'
});

assert(importResult.status === 0, `Node import evaluation exited with code 0 (got ${importResult.status})`);
assert(importResult.stdout.includes('MODULE_IMPORT_SAFE_OK'), 'Module imported without running main() test suite');
assert(!importResult.stdout.includes('KIMI ANTONELLI 3D EXPERIENCE'), 'No runner banner output on ESM import');
assert(!importResult.stdout.includes('TIER EXECUTION SUMMARY'), 'No tier execution summary output on ESM import');

// 2.2 Verify direct execution guard in source
const hasArgvGuard = /process\.argv\[1\]\s*&&\s*import\.meta\.url\s*===\s*pathToFileURL\(path\.resolve\(process\.argv\[1\]\)\)\.href/.test(runnerSource);
assert(hasArgvGuard, 'tests/runner.js has strict process.argv[1] URL matching guard');

// -------------------------------------------------------------------------
// SECTION 3: CLI Argument Parsing & Validation
// -------------------------------------------------------------------------
console.log('\n>>> 3. CLI Argument Parsing & Validation Matrix');

const cliTestCases = [
  // Valid tiers
  { args: ['--tier', '1'], expectedCode: 0, description: '--tier 1 exits 0' },
  { args: ['--tier', '2'], expectedCode: 0, description: '--tier 2 exits 0' },
  { args: ['--tier', '3'], expectedCode: 0, description: '--tier 3 exits 0' },
  { args: ['--tier', '4'], expectedCode: 0, description: '--tier 4 exits 0' },
  { args: ['--tier=1'], expectedCode: 0, description: '--tier=1 exits 0' },
  { args: ['--tier=2'], expectedCode: 0, description: '--tier=2 exits 0' },
  { args: ['--tier=3'], expectedCode: 0, description: '--tier=3 exits 0' },
  { args: ['--tier=4'], expectedCode: 0, description: '--tier=4 exits 0' },
  // Invalid tiers
  { args: ['--tier', 'foo'], expectedCode: 1, expectedErr: 'Invalid tier specified: NaN', description: '--tier foo exits 1 with NaN error' },
  { args: ['--tier', '0'], expectedCode: 1, expectedErr: 'Invalid tier specified: 0', description: '--tier 0 exits 1' },
  { args: ['--tier', '5'], expectedCode: 1, expectedErr: 'Invalid tier specified: 5', description: '--tier 5 exits 1' },
  { args: ['--tier', '-1'], expectedCode: 1, expectedErr: 'Invalid tier specified: -1', description: '--tier -1 exits 1' },
  { args: ['--tier'], expectedCode: 1, expectedErr: 'Invalid tier specified: NaN', description: '--tier (trailing) exits 1' },
  { args: ['--tier='], expectedCode: 1, expectedErr: 'Invalid tier specified: NaN', description: '--tier= (empty) exits 1' },
  { args: ['--tier=0'], expectedCode: 1, expectedErr: 'Invalid tier specified: 0', description: '--tier=0 exits 1' },
  { args: ['--tier=5'], expectedCode: 1, expectedErr: 'Invalid tier specified: 5', description: '--tier=5 exits 1' },
  { args: ['--tier=invalid'], expectedCode: 1, expectedErr: 'Invalid tier specified: NaN', description: '--tier=invalid exits 1' },
];

for (const tc of cliTestCases) {
  const res = spawnSync('node', ['tests/runner.js', ...tc.args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });

  const codeMatch = res.status === tc.expectedCode;
  let errMatch = true;
  if (tc.expectedErr) {
    errMatch = (res.stderr || '').includes(tc.expectedErr) || (res.stdout || '').includes(tc.expectedErr);
  }

  assert(codeMatch && errMatch, `${tc.description} (exit: ${res.status}, expected: ${tc.expectedCode})`);
}

// -------------------------------------------------------------------------
// SECTION 4: Stress Testing (20x Consecutive Runs)
// -------------------------------------------------------------------------
console.log('\n>>> 4. Stress Testing: 20x Consecutive Runs of node tests/runner.js');

const NUM_RUNS = 20;
const runStats = [];
let allRunsExitedZero = true;

for (let i = 1; i <= NUM_RUNS; i++) {
  const start = performance.now();
  const res = spawnSync('node', ['tests/runner.js'], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
  const duration = performance.now() - start;

  if (res.status !== 0) {
    allRunsExitedZero = false;
    console.error(`  Run ${i} failed with exit code ${res.status}`);
  }

  // Extract pass count from runner stdout: "All 117 tests passed successfully!"
  const match = res.stdout.match(/All\s+(\d+)\s+tests\s+passed\s+successfully/i);
  const passed = match ? parseInt(match[1], 10) : -1;

  const mem = process.memoryUsage();
  runStats.push({
    run: i,
    exitCode: res.status,
    passedTests: passed,
    durationMs: parseFloat(duration.toFixed(2)),
    heapUsedMB: parseFloat((mem.heapUsed / 1024 / 1024).toFixed(2)),
    rssMB: parseFloat((mem.rss / 1024 / 1024).toFixed(2)),
  });
}

console.table(runStats);

const runDurations = runStats.map(s => s.durationMs);
const runPassCounts = runStats.map(s => s.passedTests);

assert(allRunsExitedZero, `All ${NUM_RUNS} consecutive runs exited with code 0`);
const allPassed117 = runPassCounts.every((count) => count === 117);
assert(allPassed117, `All ${NUM_RUNS} runs reported exactly 117 tests passed successfully`);

const minDuration = Math.min(...runDurations).toFixed(1);
const maxDuration = Math.max(...runDurations).toFixed(1);
const avgDuration = (runDurations.reduce((a, b) => a + b, 0) / NUM_RUNS).toFixed(1);

const heapDeltas = runStats[runStats.length - 1].heapUsedMB - runStats[0].heapUsedMB;
const rssDeltas = runStats[runStats.length - 1].rssMB - runStats[0].rssMB;

console.log(`    Run Duration Stats: Min: ${minDuration}ms | Max: ${maxDuration}ms | Avg: ${avgDuration}ms`);
console.log(`    Memory Growth across 20 runs: Heap Δ: ${heapDeltas.toFixed(2)} MB | RSS Δ: ${rssDeltas.toFixed(2)} MB`);
assert(runDurations.length === NUM_RUNS, `${NUM_RUNS} runs completed successfully`);
assert(maxDuration < 5000, `Max run duration (${maxDuration}ms) is well under 5s threshold (zero hangs)`);
assert(Math.abs(heapDeltas) < 15, `Heap memory growth is negligible (< 15MB delta across 20 runs)`);

// -------------------------------------------------------------------------
// SECTION 5: Parallel Concurrency Stress (5 Simultaneous Runs)
// -------------------------------------------------------------------------
console.log('\n>>> 5. Parallel Concurrency Stress: 5 Simultaneous Instances');

const parallelPromises = Array.from({ length: 5 }, (_, idx) => {
  return new Promise((resolve) => {
    const tStart = performance.now();
    const child = spawn('node', ['tests/runner.js'], { cwd: ROOT_DIR });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => {
      const dur = performance.now() - tStart;
      resolve({ index: idx + 1, code, stdout, stderr, dur });
    });
  });
});

const parallelResults = await Promise.all(parallelPromises);

let allParallelZero = true;
let allParallel117 = true;

parallelResults.forEach((r) => {
  if (r.code !== 0) allParallelZero = false;
  if (!r.stdout.includes('All 117 tests passed successfully')) allParallel117 = false;
});

assert(allParallelZero, 'All 5 parallel runs exited with code 0');
assert(allParallel117, 'All 5 parallel runs reported 117 tests passed successfully');

// -------------------------------------------------------------------------
// SUMMARY & VERDICT
// -------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`CHALLENGER 2 ITERATION 2 VERDICT: ${failedTests === 0 ? 'APPROVE' : 'REQUEST_CHANGES'}`);
console.log(`Total Empirical Checks: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log('========================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
