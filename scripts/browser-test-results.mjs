export function assertSuccessfulRun(result) {
  if (result.overallStatus !== 'passed' || result.total === 0 ||
      result.executed !== result.total || result.passed !== result.total ||
      result.failed.length || result.skipped.length || result.errors.length) {
    throw new Error(`Browser tests did not all pass: ${JSON.stringify(result, null, 2)}`);
  }
}
