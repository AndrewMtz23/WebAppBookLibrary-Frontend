import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import v8toIstanbul from 'v8-to-istanbul';
import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

export async function collectCoverage(entries, output, root = process.cwd()) {
  const map = libCoverage.createCoverageMap({});
  for (const entry of entries) {
    if (!entry.url.startsWith('http://127.0.0.1:') || !entry.source) continue;
    const filename = path.join(output, path.basename(new URL(entry.url).pathname));
    // Angular emits source paths relative to the workspace, not dist/browser-tests.
    let sourcemap;
    try { sourcemap = JSON.parse(await readFile(filename + '.map', 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    // Runtime helper chunks can have an empty map; third-party-only chunks add no app coverage.
    if (!sourcemap.sources.some(source => source.replaceAll('\\', '/').startsWith('src/'))) continue;
    // v8-to-istanbul matches raw source names to resolved trace-map positions.
    // Absolute file URLs keep both names identical, including on Windows.
    sourcemap.sources = sourcemap.sources.map(source => pathToFileURL(path.resolve(root, source)).href);
    sourcemap.sourceRoot = '';
    const converter = v8toIstanbul(filename, 0, { source: entry.source, sourceMap: { sourcemap } });
    await converter.load();
    converter.applyCoverage(entry.functions);
    map.merge(converter.toIstanbul());
  }
  const sourceRoot = path.resolve(root, 'src') + path.sep;
  map.filter(file => path.resolve(file).startsWith(sourceRoot) && !/\.(spec|browser-check)\.ts$/.test(file));
  if (!map.files().length) throw new Error('No application source coverage was collected');
  return map;
}

export async function writeCoverage(entries, output) {
  const map = await collectCoverage(entries, output);
  const context = libReport.createContext({ dir: 'coverage/digital-library-client', coverageMap: map });
  for (const format of ['html', 'lcovonly', 'json', 'text-summary']) reports.create(format).execute(context);
}
