# Phase 5: browser quality evidence

## Current delivery — 2026-09-19

Final local browser run: **26 passed, zero failures (4.0 minutes)**. Full report: ignored `playwright-report/`; screenshots/traces: ignored `test-results/`. GitHub execution is independently recorded in Actions for the published commit.

The earlier evidence below is historical. Current local verification: 220 unit tests and two reduced-motion checks passed in Chrome 153; production build passed at 865.30 kB initial / 189.50 kB estimated transfer, within the existing 900 kB warning / 1 MB error budgets. Production dependency audit reports zero vulnerabilities. The matching backend passed 251 tests with no skips.

The browser suite now contains 26 tests, including every required phase-5 journey: digital registration/access, last physical copy with a real second-reader conflict and return, librarian creation/inventory/return, administrative role/state changes with audit, overdue dashboard drilldown, and expired-session return. Additional checks cover shared profile editing for all roles, dialogs, sidebar, light/dark contrast, four viewport sizes, pagination/filter restoration, slow/timeout/503/empty/recovered data, focus trapping/restoration and 200% CSS magnification. Profile tests create independent accounts; staff dark-mode tests seed their own reservation.

These journeys exposed fixes for lost domain error codes after HTTP error conversion, silent refresh failure with existing catalog results, light-mode contrast and long-name mobile overflow. The physical-copy conflict now displays its specific message; failed catalog refresh preserves the results and offers a visible retry.

`Integrated browser QA` runs on push, pull request and optional manual dispatch. It pins compatible backend `bd2cb8983fd30bffe7b69ac00f35dfd2bdd4dc6f` by default and permits an explicit manual override. It creates only local fictitious MongoDB data, retains browser evidence and stops its database container. The ordinary CI adds a pinned, checksum-verified Gitleaks scan of fetched Git history with redacted output. npm 10 lockfile compatibility was reproduced and fixed; earlier successful frontend CI run: `35446677052`.

Release acceptance still requires owner-configured branch protection, authorized staging/snapshot/restore evidence, deployment monitoring and human screen-reader/actual browser-zoom review. CSS magnification and axe do not certify WCAG compliance. External digital-resource interception checks application navigation, not the provider's uptime. See the backend `docs/release-operations.md` for measured API latency, proposed alerts, migration rehearsal and rollout/rollback instructions.

## Historical first delivery — 2026-09-18

Local verification on 2026-09-18, Windows and Chrome 152. The matching backend contains `tools/BookLibrary.QaHost`; see its `docs/phase5-quality.md` for the isolated MongoDB replica set and API startup. No Atlas data is used.

## Repeat the checks

```powershell
npm ci
npm test -- --watch=false --browsers=ChromeHeadless --code-coverage
npm run test:reduced-motion
npm run build -- --configuration production
npm audit --omit=dev
python scripts/check-sensitive-files.py
```

For browser checks, start the backend QA host, then run these in separate terminals:

```powershell
npx ng serve --port 4284 --proxy-config proxy.e2e.json
npm run test:e2e
```

Chrome must be installed. Alternatively install Playwright Chromium (`npx playwright install chromium`) and set `E2E_CHROME_CHANNEL=chromium`. The suite refuses an API without the isolated fixture marker. It uses fictitious accounts, unique registration names and real HTTP requests; the intentional save-error test mocks a 503, and the digital-opening test intercepts the external resource after the API authorizes access. External site availability is not verified by that test.

Reports are in `playwright-report/`, screenshots/traces in `test-results/`; both are ignored by Git. `npm run test:e2e:report` opens the report. The manually triggered `Integrated browser QA` workflow requires the compatible backend branch/commit and uploads artifacts; it has not yet been executed on GitHub. Unit tests, reduced motion, build, audit and the sensitive-file check run in the normal frontend CI.

## Evidence and fixes

- Final automated results: 216 frontend tests, two reduced-motion checks and seven browser tests passed; the matching backend passed 240 tests without skips. Production build passed. Coverage is diagnostic: frontend lines 84.28%, branches 66.04%.
- Seven browser tests passed: 14 routes × four viewports (360×800, 768×1024, 1366×768, 1920×1080), repeated account save, failed save, registration/digital access and expired-session return.
- All 56 route/viewport combinations had one h1, no horizontal document overflow and no axe violations for WCAG 2 A/AA, 2.1 AA and 2.2 AA tags. The route tests also assert no uncaught page exceptions. This covers the seeded page states, not every menu, dialog, loading or error state.
- The browser run exposed and verified fixes for muted-text and dark-background brand contrast, genre-index contrast, focus restoration after user save, and the previously ignored login return URL. Return paths are allowlisted by role; query filters are retained.
- Production compilation no longer fetches Google Fonts; fonts still load at runtime with fallback fonts. It is not a claim that all assets are self-hosted/offline.
- Initial production bundle baseline: **780.8 kB raw / 184.49 kB estimated transfer** after corrections. The enforced initial budget is 900 kB warning / 1 MB error, replacing the former 2/5 MB limits. Lazy route chunks remain separate. This is a bundle measurement, not a Core Web Vitals score.
- Production dependency audit: zero reported vulnerabilities. A compatible `npm audit fix` removed the `qs` advisory chain. Five moderate development-only findings remain through `uuid → sockjs → webpack-dev-server → Angular build tooling`; npm reports no compatible automatic fix. The development server remains loopback-only and must not serve production. Do not use `npm audit fix --force` as an unreviewed release step.
- The new secret check covers known patterns and tracked environment files, not all possible secrets or Git history.

## Still open

The phase-5 release gate is not closed. Complete the remaining physical-inventory and librarian workflows, role/state/audit and dashboard overdue journeys; broader empty/error/offline states; manual keyboard, actual browser zoom and assistive-technology checks; performance baseline beyond bundle size; and the staging/backup/rollout/rollback gates recorded in the backend runbook. Production accessibility or release readiness must not be inferred solely from these seven tests.
