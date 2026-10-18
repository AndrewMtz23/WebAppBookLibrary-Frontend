import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { collectCoverage } from './browser-test-coverage.mjs';

test('attributes uncovered application function to its source in a multi-source chunk', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'booklibrary-coverage-'));
  try {
    const output = path.join(root, 'dist');
    await mkdir(output);
    const dependency = 'const library = 1;\n';
    const application = 'function unused() { return 42; }\n';
    const source = dependency + application;
    await writeFile(path.join(output, 'main.js.map'), JSON.stringify({ version: 3, sources: ['node_modules/library/src/index.js', 'src/example.ts'], sourcesContent: [dependency, application], names: [], mappings: 'AAAA;ACAA' }));
    const map = await collectCoverage([{ url: 'http://127.0.0.1:1234/main.js', source, functions: [
      { functionName: '', isBlockCoverage: true, ranges: [{ startOffset: 0, endOffset: source.length, count: 1 }] },
      { functionName: 'unused', isBlockCoverage: true, ranges: [{ startOffset: dependency.length, endOffset: source.length - 1, count: 0 }] },
    ] }], output, root);
    assert.deepEqual(map.files(), [path.join(root, 'src/example.ts')]);
    const coverage = map.fileCoverageFor(map.files()[0]);
    assert.equal(Object.keys(coverage.fnMap).length, 1);
    assert.equal(Object.values(coverage.f)[0], 0);
    assert.equal(coverage.fnMap[0].name, 'unused');
  } finally {
    // This directory is the exact mkdtemp result created by this test.
    await rm(root, { recursive: true, force: true });
  }
});
