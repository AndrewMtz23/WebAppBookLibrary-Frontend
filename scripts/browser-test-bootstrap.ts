import '@angular/compiler';
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  teardown: { destroyAfterEach: true },
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

const result = { overallStatus: '', total: 0, executed: 0, passed: 0, failed: [] as string[], skipped: [] as string[], errors: [] as string[] };
jasmine.getEnv().configure({ random: true });
jasmine.getEnv().addReporter({
  jasmineStarted: info => { result.total = info.totalSpecsDefined; },
  specDone: spec => {
    result.executed++;
    if (spec.status === 'passed') result.passed++;
    else if (spec.status === 'failed') result.failed.push(`${spec.fullName}: ${spec.failedExpectations.map(e => e.message + '\n' + e.stack).join('\n')}`);
    else result.skipped.push(`${spec.fullName}: ${spec.status}`);
  },
  suiteDone: suite => { result.errors.push(...suite.failedExpectations.map(e => e.message)); },
  jasmineDone: details => {
    result.overallStatus = details.overallStatus;
    result.errors.push(...details.failedExpectations.map(e => e.message));
    (window as unknown as { __testResult: typeof result }).__testResult = result;
  },
});
