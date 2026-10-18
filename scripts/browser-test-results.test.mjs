import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertSuccessfulRun } from './browser-test-results.mjs';

const passed = { overallStatus: 'passed', total: 2, executed: 2, passed: 2, failed: [], skipped: [], errors: [] };
test('accepts every discovered test passing', () => assert.doesNotThrow(() => assertSuccessfulRun(passed)));
test('rejects a failing spec', () => assert.throws(() => assertSuccessfulRun({ ...passed, passed: 1, failed: ['spec failed'] })));
test('rejects zero discovered tests', () => assert.throws(() => assertSuccessfulRun({ ...passed, total: 0, executed: 0, passed: 0 })));
test('rejects skipped tests', () => assert.throws(() => assertSuccessfulRun({ ...passed, passed: 1, skipped: ['pending'] })));
test('rejects focused suites that omit discovered tests', () => assert.throws(() => assertSuccessfulRun({ ...passed, total: 3 })));
test('rejects runtime errors even after passing assertions', () => assert.throws(() => assertSuccessfulRun({ ...passed, errors: ['uncaught error'] })));
test('rejects failed suite hooks', () => assert.throws(() => assertSuccessfulRun({ ...passed, overallStatus: 'failed' })));
