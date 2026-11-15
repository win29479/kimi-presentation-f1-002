#!/usr/bin/env node
/**
 * Standalone E2E Test Runner for Kimi Antonelli 3D Experience
 *
 * Supports:
 *   node tests/runner.js
 *   node tests/runner.js --tier 1
 *   node tests/runner.js --tier 2
 *   node tests/runner.js --tier 3
 *   node tests/runner.js --tier 4
 *   node tests/runner.js --verbose
 */

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

// ANSI escape codes for terminal formatting
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

// Global Test Registry
const currentSuite = {
  tierName: '',
  describes: [],
  currentDescribe: null,
};

class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

export function expect(actual) {
  const matchers = {
    toBe(expected) {
      if (actual !== expected) {
        throw new AssertionError(
          `Expected ${JSON.stringify(actual)} to be strictly equal to ${JSON.stringify(expected)}`,
          actual,
          expected
        );
      }
    },
    toEqual(expected) {
      if (!deepEqual(actual, expected)) {
        throw new AssertionError(
          `Expected ${JSON.stringify(actual)} to deeply equal ${JSON.stringify(expected)}`,
          actual,
          expected
        );
      }
    },
    toBeGreaterThan(n) {
      if (!(actual > n)) {
        throw new AssertionError(`Expected ${actual} to be > ${n}`, actual, n);
      }
    },
    toBeGreaterThanOrEqual(n) {
      if (!(actual >= n)) {
        throw new AssertionError(`Expected ${actual} to be >= ${n}`, actual, n);
      }
    },
    toBeLessThan(n) {
      if (!(actual < n)) {
        throw new AssertionError(`Expected ${actual} to be < ${n}`, actual, n);
      }
    },
    toBeLessThanOrEqual(n) {
      if (!(actual <= n)) {
        throw new AssertionError(`Expected ${actual} to be <= ${n}`, actual, n);
      }
    },
    toBeCloseTo(expected, precision = 2) {
      const diff = Math.abs(actual - expected);
      const tolerance = Math.pow(10, -precision) / 2;
      if (diff > tolerance) {
        throw new AssertionError(
          `Expected ${actual} to be close to ${expected} (within ${tolerance}, diff=${diff})`,
          actual,
          expected
        );
      }
    },
    toContain(item) {
      if (typeof actual === 'string' || Array.isArray(actual)) {
        if (!actual.includes(item)) {
          throw new AssertionError(
            `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`,
            actual,
            item
          );
        }
      } else {
        throw new AssertionError(`Cannot call toContain on non-iterable`, actual, item);
      }
    },
    toMatch(regex) {
      const re = typeof regex === 'string' ? new RegExp(regex) : regex;
      if (!re.test(String(actual))) {
        throw new AssertionError(`Expected "${actual}" to match pattern ${regex}`, actual, regex);
      }
    },
    toThrow(expected) {
      if (typeof actual !== 'function') {
        throw new AssertionError(`Expected actual to be a function that throws`);
      }
      let threw = false;
      let errorThrown = null;
      try {
        actual();
      } catch (err) {
        threw = true;
        errorThrown = err;
      }
      if (!threw) {
        throw new AssertionError(`Expected function to throw an error, but it returned normally`);
      }
      if (expected) {
        if (typeof expected === 'string' && !errorThrown.message.includes(expected)) {
          throw new AssertionError(
            `Expected error message "${errorThrown.message}" to include "${expected}"`,
            errorThrown.message,
            expected
          );
        } else if (expected instanceof RegExp && !expected.test(errorThrown.message)) {
          throw new AssertionError(
            `Expected error message "${errorThrown.message}" to match ${expected}`,
            errorThrown.message,
            expected
          );
        }
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new AssertionError(`Expected truthy value, but received ${actual}`, actual, true);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new AssertionError(`Expected falsy value, but received ${actual}`, actual, false);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new AssertionError(`Expected null, received ${actual}`, actual, null);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new AssertionError(`Expected defined value, received undefined`, actual, 'defined');
      }
    },
  };

  matchers.not = {
    toBe(expected) {
      if (actual === expected) {
        throw new AssertionError(`Expected ${actual} NOT to be ${expected}`);
      }
    },
    toEqual(expected) {
      if (deepEqual(actual, expected)) {
        throw new AssertionError(`Expected ${JSON.stringify(actual)} NOT to deeply equal ${JSON.stringify(expected)}`);
      }
    },
    toContain(item) {
      if (actual && actual.includes && actual.includes(item)) {
        throw new AssertionError(`Expected collection NOT to contain ${JSON.stringify(item)}`);
      }
    },
    toMatch(regex) {
      const re = typeof regex === 'string' ? new RegExp(regex) : regex;
      if (re.test(String(actual))) {
        throw new AssertionError(`Expected "${actual}" NOT to match ${regex}`);
      }
    },
  };

  return matchers;
}

export function describe(title, fn) {
  const describeBlock = {
    title,
    tests: [],
    beforeEachFns: [],
    afterEachFns: [],
  };
  const prevDescribe = currentSuite.currentDescribe;
  currentSuite.currentDescribe = describeBlock;
  currentSuite.describes.push(describeBlock);

  fn();

  currentSuite.currentDescribe = prevDescribe;
}

export function it(title, fn) {
  if (!currentSuite.currentDescribe) {
    describe('Default Suite', () => {});
  }
  currentSuite.currentDescribe.tests.push({ title, fn });
}

export const test = it;

export function beforeEach(fn) {
  if (currentSuite.currentDescribe) {
    currentSuite.currentDescribe.beforeEachFns.push(fn);
  }
}

export function afterEach(fn) {
  if (currentSuite.currentDescribe) {
    currentSuite.currentDescribe.afterEachFns.push(fn);
  }
}

// Make globals available for test files
globalThis.describe = describe;
globalThis.it = it;
globalThis.test = test;
globalThis.expect = expect;
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach;

// Test Runner Execution Engine
async function runTier(tierNumber, testFile, verbose) {
  currentSuite.tierName = `Tier ${tierNumber}`;
  currentSuite.describes = [];
  currentSuite.currentDescribe = null;

  console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  RUNNING TIER ${tierNumber}: ${path.basename(testFile)}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

  const fileUrl = pathToFileURL(path.resolve(testFile)).href;
  const startLoad = performance.now();
  await import(fileUrl);
  const loadDuration = (performance.now() - startLoad).toFixed(2);

  let passedInTier = 0;
  let failedInTier = 0;
  const failures = [];
  const tierStart = performance.now();

  for (const desc of currentSuite.describes) {
    console.log(`  ${colors.bold}${colors.white}${desc.title}${colors.reset}`);
    for (const t of desc.tests) {
      const tStart = performance.now();
      try {
        for (const b of desc.beforeEachFns) await b();
        try {
          await t.fn();
        } finally {
          for (const a of desc.afterEachFns) await a();
        }
        const tDuration = (performance.now() - tStart).toFixed(1);
        console.log(`    ${colors.green}✓${colors.reset} ${colors.dim}${t.title}${colors.reset} ${colors.dim}(${tDuration}ms)${colors.reset}`);
        passedInTier++;
      } catch (err) {
        const tDuration = (performance.now() - tStart).toFixed(1);
        console.log(`    ${colors.red}✗ ${t.title}${colors.reset} ${colors.dim}(${tDuration}ms)${colors.reset}`);
        failedInTier++;
        failures.push({
          suite: desc.title,
          test: t.title,
          error: err,
        });
      }
    }
    console.log('');
  }

  const tierDuration = (performance.now() - tierStart).toFixed(2);

  if (failures.length > 0) {
    console.log(`  ${colors.bold}${colors.red}Failures in Tier ${tierNumber}:${colors.reset}`);
    for (const fail of failures) {
      console.log(`\n  ${colors.red}● ${fail.suite} › ${fail.test}${colors.reset}`);
      console.log(`    ${colors.yellow}${fail.error.message}${colors.reset}`);
      if (verbose && fail.error.stack) {
        console.log(`    ${colors.dim}${fail.error.stack.split('\n').slice(1, 5).join('\n    ')}${colors.reset}`);
      }
    }
  }

  return {
    tier: tierNumber,
    file: testFile,
    passed: passedInTier,
    failed: failedInTier,
    total: passedInTier + failedInTier,
    duration: tierDuration,
    failures,
  };
}

async function main() {
  const args = process.argv.slice(2);
  let tierSpecified = false;
  let targetTier = null;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tier') {
      tierSpecified = true;
      targetTier = args[i + 1] !== undefined ? parseInt(args[i + 1], 10) : NaN;
      i++;
    } else if (args[i].startsWith('--tier=')) {
      tierSpecified = true;
      const raw = args[i].split('=')[1];
      targetTier = raw ? parseInt(raw, 10) : NaN;
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      verbose = true;
    }
  }

  if (tierSpecified && (Number.isNaN(targetTier) || ![1, 2, 3, 4].includes(targetTier))) {
    console.error(`${colors.red}Error: Invalid tier specified: ${targetTier}. Must be 1, 2, 3, or 4.${colors.reset}`);
    process.exit(1);
  }

  const allTiers = [
    { tier: 1, file: path.resolve('tests/tier1_features.test.js') },
    { tier: 2, file: path.resolve('tests/tier2_boundary.test.js') },
    { tier: 3, file: path.resolve('tests/tier3_combinations.test.js') },
    { tier: 4, file: path.resolve('tests/tier4_realworld.test.js') },
  ];

  const tiersToRun = targetTier !== null
    ? allTiers.filter((t) => t.tier === targetTier)
    : allTiers;

  console.log(`\n${colors.bold}${colors.magenta}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}   KIMI ANTONELLI 3D EXPERIENCE — E2E TEST RUNNER                      ${colors.reset}`);
  console.log(`${colors.dim}   Timestamp: ${new Date().toISOString()} | Node: ${process.version}${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}========================================================================${colors.reset}`);

  const startTime = performance.now();
  const results = [];

  for (const t of tiersToRun) {
    const res = await runTier(t.tier, t.file, verbose);
    results.push(res);
  }

  const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);
  const totalPassed = results.reduce((acc, r) => acc + r.passed, 0);
  const totalFailed = results.reduce((acc, r) => acc + r.failed, 0);
  const totalTests = totalPassed + totalFailed;

  console.log(`\n${colors.bold}========================================================================${colors.reset}`);
  console.log(`${colors.bold}  TEST EXECUTION SUMMARY${colors.reset}`);
  console.log(`========================================================================`);
  for (const r of results) {
    const statusColor = r.failed === 0 ? colors.green : colors.red;
    const statusText = r.failed === 0 ? 'PASSED' : 'FAILED';
    console.log(
      `  Tier ${r.tier}: ${statusColor}${statusText.padEnd(8)}${colors.reset} ` +
      `Passed: ${colors.green}${String(r.passed).padStart(3)}${colors.reset} | ` +
      `Failed: ${r.failed > 0 ? colors.red : colors.dim}${String(r.failed).padStart(3)}${colors.reset} | ` +
      `Total: ${String(r.total).padStart(3)} | Time: ${r.duration}ms`
    );
  }
  console.log(`------------------------------------------------------------------------`);
  const finalStatus = totalFailed === 0
    ? `${colors.bgGreen}${colors.bold}  PASS  ${colors.reset} All ${totalTests} tests passed successfully!`
    : `${colors.bgRed}${colors.bold}  FAIL  ${colors.reset} ${totalFailed} of ${totalTests} tests failed.`;
  console.log(`  ${finalStatus}`);
  console.log(`  Total Duration: ${totalDuration}s`);
  console.log(`========================================================================\n`);

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error(`${colors.red}Unhandled Runner Exception:${colors.reset}`, err);
    process.exit(1);
  });
}
