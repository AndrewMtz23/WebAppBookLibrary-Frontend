import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { assertSuccessfulRun } from './browser-test-results.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const args = process.argv.slice(2);
const allowed = new Set(['--reduced-motion', '--code-coverage', '--watch=false', '--browsers=ChromeHeadless', '--reporters=dots']);
for (const arg of args) if (!allowed.has(arg)) throw new Error(`Unsupported test option: ${arg}`);
const reduced = args.includes('--reduced-motion');
const coverage = args.includes('--code-coverage');
const files = (await readdir('src', { recursive: true })).filter(file => file.endsWith('.spec.ts')).sort();
if (!files.length) throw new Error('No spec files found');
const imports = (reduced ? ['app/reduced-motion.browser-check.ts'] : files)
  .map(file => `import '../../src/${file.replaceAll('\\', '/').replace(/\.ts$/, '')}';`).join('\n');
await mkdir('.angular/browser-tests', { recursive: true });
// HTML loads Jasmine as browser scripts before Zone installs its Jasmine adapter.
await writeFile('.angular/browser-tests/entry.ts', `import '../../scripts/browser-test-bootstrap';\n${imports}\njasmine.getEnv().execute();\n`);
const build = spawnSync(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'run', 'digital-library-client:browser-tests'], {
  stdio: 'inherit', env: { ...process.env, CI: 'true', NG_CLI_ANALYTICS: 'false' }, timeout: 180_000,
});
if (build.status !== 0) throw new Error(`Test build failed: ${build.error ?? build.status}`);

const output = path.resolve('dist/browser-tests');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = path.resolve(output, '.' + (requestPath === '/' ? '/index.html' : requestPath));
    if (!target.startsWith(output + path.sep)) { res.writeHead(403).end(); return; }
    const content = await readFile(target);
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] ?? 'application/octet-stream' }).end(content);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ channel: process.env.E2E_CHROME_CHANNEL || 'chrome', headless: true });
  const page = await browser.newPage({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  if (coverage) await page.coverage.startJSCoverage({ resetOnNavigation: false });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  try {
    await page.waitForFunction(() => window.__testResult, undefined, { timeout: 90_000 });
  } catch (error) {
    throw new Error(`Browser suite did not complete: ${errors.join('\n')}`, { cause: error });
  }
  const result = await page.evaluate(() => window.__testResult);
  result.errors.push(...errors);
  await mkdir('test-results', { recursive: true });
  await writeFile(`test-results/jasmine${reduced ? '-reduced-motion' : ''}.json`, JSON.stringify(result, null, 2));
  if (coverage) {
    const { writeCoverage } = await import('./browser-test-coverage.mjs');
    await writeCoverage(await page.coverage.stopJSCoverage(), output);
  }
  assertSuccessfulRun(result);
  console.log(`Jasmine in Chrome: ${result.passed}/${result.total} passed, no skipped tests (${files.length} spec files discovered).`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
