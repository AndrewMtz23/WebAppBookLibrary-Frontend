# Public Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution or superpowers:subagent-driven-development if explicitly selected. Track each checkbox and record failing/passing checks.

**Goal:** Open discovery and book information to visitors while requesting authentication before any personal action.

**Architecture:** Reuse the existing reader shell and catalog API. Guard individual private routes, expose only three book read actions, and centralize the sign-in prompt through Angular Material Dialog. Observe session changes to invalidate personalized data and preserve a validated return destination across authentication.

**Tech Stack:** Angular 20, Angular Material/CDK, RxJS, ASP.NET Core 8, MongoDB, Jasmine/Karma, xUnit and Playwright.

**Spec:** `../specs/2026-09-20-public-discovery-design.md` (approved).

## Execution ledger — 2026-09-20

The user's subsequent `vas` / `continua` authorized native execution. The checklist below records the original planned sequence; this ledger records the implementation and adaptations actually performed.

- Task 1 implemented: anonymous GET list/facets/detail; real HTTP authorization regression went from 401 failure to passing. Backend commit `f7043c2`. Full backend: 252 passed, zero skipped against isolated local MongoDB. Date-dependent dashboard fixture repaired separately in `d1466b8`.
- Task 2 implemented: public entry and individually guarded private routes, guest navbar, safe role-aware return URLs. Route regressions reproduced and passed.
- Task 3 implemented: shared Material/CDK sign-in dialog for reserve/save across discovery, catalog and detail; no mutation before login. Focus timing failure reproduced in browser and fixed with immediate focus trapping.
- Task 4 implemented: dedicated SessionScopeService invalidates personalized facades and cancels outstanding requests on identity changes. Anonymous/login/old-session 401s are ignored. Current-session expiry is handled without forcing public visitors to login. Local expiry before a request and expiry in flight were independently reviewed, reproduced with two failing tests, and corrected. Concurrent notifications and delayed favorite callbacks have unit coverage.
- Task 5 implemented: sanitized return URL survives registration, auth form switches and login; no automatic reserve/save. Stock is fetched again on return.
- Task 6 completed locally: 230 frontend unit tests, 2 reduced-motion tests, production build and 32 browser tests (4.1 minutes) pass. Browser evidence and final delivery status are recorded in `docs/phase5-quality.md`. All six task outcomes are implemented; the procedural bullets below are the original plan, not pending product work.

Execution adaptations: session invalidation uses a standalone scope service to avoid dependency cycles. Shared account-menu changes retain the earlier authorized logout positioning fix. The implementation is kept on local main as requested; no new remote publication, PR or deployment is performed. Manual assistive technology, actual browser zoom and staging release gates remain outside this local verification.

## Global constraints

- Frontend paths below are relative to this repository; backend paths are relative to `BackEnd/WebAppBookLibrary` in the shared workspace.
- Keep local `main`; preserve existing logout CSS/regression edits and the backend's unstaged `.env.example` deletion. Stage only explicit task files. No Atlas mutation, deployment, merge, PR creation or remote publication as part of this plan without session authorization for that action.
- Public routes: `/app/discover`, `/app/catalog`, `/app/catalog/:bookId`, `/privacy`, `/legal`; `/` and `/app` redirect to discovery. Keep role landing behavior after login without a valid returnUrl.
- Only readers reserve/save. API authorization remains authoritative; anonymous responses contain only active books and never DigitalResourceUrl.
- Registration still leads to login. Never replay a mutation after authentication. No guest accounts, anonymous favorites persistence, new dependencies, migrations or SEO/SSR changes.
- Any browser mutations use the existing loopback QA host and its fictitious disposable database.

## Review focus

1. Two concurrent 401s or a response from an old token must not clear a newly authenticated account (Task 4).
2. A canceled old favorite/loan callback must not repopulate state or clear a newer request's busy state (Task 4).
3. Anonymous requests with `isActive=false`, a direct inactive ID or a digital URL request must not bypass restrictions (Tasks 1/6).
4. A modal opened from a card inside a sticky/blurred navbar must trap focus and restore it without opening the card or clipping the dialog (Tasks 3/6).
5. Registration detours, hostile return URLs, and last-copy changes while authenticating must preserve a safe destination without an automatic reservation (Tasks 5/6).

## Task 1 — Public catalog API

**Files:** modify backend `WebAppBookLibrary/Controllers/BooksController.cs`; create `WebAppBookLibrary.Tests/PublicCatalogHttpTests.cs`; extend `WebAppBookLibrary.Tests/BookServiceTests.cs` only if missing inactive/null-viewer assertions. Use `CatalogHttpQueryTests.cs` as the real MVC host pattern, with authentication/authorization enabled and no forged authenticated principal.

**Interface:** existing GET `/api/books`, `/api/books/facets`, `/api/books/{id}` accept no JWT. `SearchAsync(query, false, null, cancellationToken)` and `GetDetailAsync(id, false, null, cancellationToken)` remain the anonymous service calls. DTOs stay unchanged.

- Write failing HTTP tests for the three public reads using a mock IBookStore and real controllers. Assert anonymous query identity is null and includeInactive is false; assert management, POST/PUT/DELETE and digital-access reject anonymous requests. Use the existing JWT host setup from `AdminUserJwtHttpTests.cs` for challenge behavior rather than disabling auth.

```csharp
Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/books")).StatusCode);
Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/books/facets")).StatusCode);
Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/books/{inactiveId}")).StatusCode);
Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync($"/api/books/{activeId}/management")).StatusCode);
Assert.DoesNotContain("digitalResourceUrl", await (await client.GetAsync($"/api/books/{activeId}")).Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
```

- Run `dotnet test WebAppBookLibrary.sln -c Release --filter FullyQualifiedName~PublicCatalogHttpTests`; confirm public reads fail with authorization before changing production code.
- Add `[AllowAnonymous]` only to GetAll, GetFacets and GetById. Keep `[Authorize]` on the controller and the existing endpoint policies. Review the active-only store filtering against the local Mongo integration tests; do not trust query flags as authorization.
- Repeat focused tests and `AuthorizationPolicyTests`, `BookContractTests`, `CatalogHttpQueryTests`. Commit only API/test changes as `feat: allow anonymous catalog reads`.

## Task 2 — Shared route and navigation contract

**Files:** `src/app/app.routes.ts`, `features/reader/reader.routes.ts`, `core/auth/return-route.ts`, `core/navigation/navigation.config.ts`, `core/layouts/reader-shell/reader-shell.component.ts`; corresponding route/navigation/return-route specs.

**Interfaces:** add `isPublicBrowseRoute(value: string): boolean` and `safeAuthReturnUrl(value: string | null): string | null` to `return-route.ts`. The latter rejects controls, backslashes, external/protocol-relative URLs and any path outside the existing role-aware route patterns plus legal/privacy; final permission is still checked by `returnRouteForRole`. Extend `readerNavigationForRole(role: UserRole | null)` to return only public items for null. Preserve query/fragment text only after validating the path.

- Add failing tests for public root routing, public shell, private child authentication and null-role navigation. Include unsafe and role-mismatched destinations:

```typescript
expect(routes.find(route => route.path === '')?.redirectTo).toBe('app/discover');
expect(readerNavigationForRole(null).map(item => item.label)).toEqual(['Descubrir', 'Catálogo']);
expect(safeAuthReturnUrl('//evil.example')).toBeNull();
expect(returnRouteForRole('/admin/users', 'user')).toBe('/app/discover');
expect(isPublicBrowseRoute('/app/catalog?page=2')).toBeTrue();
```

- Run the affected specs with `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/app.routes.spec.ts --include=src/app/features/reader/reader.routes.spec.ts --include=src/app/core/auth/return-route.spec.ts`. Observe failure.
- Change root to a static discovery redirect; remove unused root inject imports. Remove guards only from the reader parent. Set `[AuthGuard, RoleGuard]` explicitly on my-library, favorites and profile, preserving existing roles. Keep staff trees unchanged.
- Make the reader shell session-reactive with `toSignal(auth.session$)` instead of defaulting anonymous to user. Use null-role public navigation; avoid showing a fabricated reader identity.
- Repeat focused checks; commit `feat: expose discovery and keep personal routes protected`.

## Task 3 — Visitor navbar and reusable authentication modal

**Files:** create `src/app/core/auth/reader-action-access.service.ts` and `.spec.ts`; create `src/app/shared/ui/sign-in-required-dialog/sign-in-required-dialog.component.ts`, `.html`, `.scss`, `.spec.ts`; modify account-menu component TS/HTML/SCSS/spec; modify discover, catalog and book-detail page TS/HTML/specs. Reuse existing card events rather than adding click handlers to card containers.

**Interfaces:** `ReaderAction = 'reserve' | 'favorite'`; `ReaderActionAccessService.ensureReader(action: ReaderAction, bookId: string): boolean` returns true only for a valid reader session. For anonymous/locally expired sessions open one MatDialog with `{ action, returnUrl: '/app/catalog/' + encodeURIComponent(bookId) }`; for signed-in staff return false with a permission message. Dialog data type is `{action: ReaderAction; returnUrl: string}`. Login/register use queryParams `{returnUrl}`. Keep the service separate from AuthInterceptor to avoid a DI cycle through dialog components and HttpClient.

- Test visitor attempts without any facade mutation; test a valid reader, an expired token, staff denial and repeated clicks. Use the real AuthService token validation for expiration cases.

```typescript
expect(access.ensureReader('favorite', book.id)).toBeFalse();
expect(access.ensureReader('favorite', book.id)).toBeFalse();
expect(dialog.open).toHaveBeenCalledTimes(1);
expect(reader.addFavorite).not.toHaveBeenCalled();
```

- Run the new service/component specs and observe failure before implementing their contracts.
- Implement MatDialog with one stored ref, cleared on afterClosed; close on navigation. Use Material defaults for focus restoration/trapping and block-scroll, labelled title/description, Escape/backdrop dismissal, maxWidth `calc(100vw - 2rem)`, maxHeight `calc(100dvh - 2rem)`, existing theme tokens. Render via CDK overlay, not nested in the navbar. Test background interaction blocking; preserve any pre-existing inert state if explicit inert handling is necessary.
- Add guest login/register navbar buttons with safe returnUrl from the current route. Show the mobile navbar for visitors rather than a personal-profile control. Keep private navigation hidden for guests, while direct private URLs remain guarded.
- Replace guest-vs-reader visibility with `!session || role === 'user'` only for actionable buttons. Route every reserve/favorite handler through ensureReader before analytics/facades. Keep physical-out-of-stock disabled and staff controls unchanged. Cover related cards and Descubrir rows; move direct template calls to guarded page methods.

```typescript
toggleFavorite(book: BookSummary): void {
  if (!this.actionAccess.ensureReader('favorite', book.id)) return;
  this.favorites.toggle(book);
}
```

- Repeat service/component specs and existing account-menu/logout tests. Commit `feat: prompt visitors before personal book actions`, staging only this task's changes; preserve existing logout edits separately.

## Task 4 — Session transitions and private-state isolation

**Files:** `core/services/auth.service.ts`, `core/interceptors/auth.interceptor.ts`, `core/services/session-notification.service.ts`; `features/reader/data-access/favorites.facade.ts`, `reservations.facade.ts`, `discover.facade.ts`; `features/catalog/data-access/catalog.facade.ts`; book-detail TS; corresponding specs; account-menu and workspace-shell logout handlers/specs.

**Interface:** retain AuthService.session$ and logout(). Consumers derive identity from user ID plus role/token, not display-name edits. Reuse `isPublicBrowseRoute` for expiration/logout destination. A protected HTTP request captures the token used; only a 401 for that same still-current token can expire that session. Login/register errors bypass session-expiration handling.

- Write failing tests with Subjects for delayed favorite/loan responses, logout then new account, concurrent 401s and old-token 401 after re-login. Assert anonymous discovery makes zero dashboard/loan/favorite calls, and old state is removed immediately rather than retained on refresh error.

```typescript
auth.logout();
oldFavoriteResponse.next({});
expect(favorites.items()).toEqual([]);
expect(favorites.isFavorite({...book, isFavorite: false})).toBeFalse();
expect(reservations.successfulBookId()).toBeNull();
```

- Run facade/interceptor/session specs; observe the stale-state or unexpected-navigation failures.
- Subscribe to session identity changes with takeUntilDestroyed. Cancel outstanding private requests and increment a generation counter before reset; callbacks/finalizers mutate state only if their captured generation still matches. Clear overrides, lists, busy IDs, messages, successful IDs and personal catalog detail immediately. Never carry personalized fallback results across identities.
- Reload public catalog/detail/discovery on identity transitions using switchMap; limit private activity requests to current valid readers. Preserve filtering while reloading. Treat 403/network/5xx as their actual error types rather than auth prompts.
- Interceptor skips attaching expired credentials and passes login failures through. On a real current-session 401, clear once; public pages remain browseable with an auth notice/action, private pages navigate to login with safe returnUrl. Guard against concurrent and old-token responses.
- Logout from a public browse/legal page stays on that route; logout from private pages navigates to discovery. Keep the existing progress UI and focus behavior, reset the loading flag if the component remains mounted. Test repeating logout after signing back in.
- Repeat focused tests, then full unit suite once all failures are fixed. Commit `fix: isolate personal state across authentication changes`.

## Task 5 — Return destination through login and registration

**Files:** login/register TS/HTML and specs under `src/app/features/auth/`; create `register.component.spec.ts` if absent. Reuse the route helpers from Task 2.

**Interface:** query key remains `returnUrl`; registration sends it to login, login/register switches preserve it, successful login passes it through `returnRouteForRole(value, actualRole)`. No pending mutation payload is stored.

- Add failing tests for registration-success navigation, switching between auth forms, validation errors retaining destination, public filters, malicious returnUrl and staff fallback. Use existing auth module/TestBed providers rather than a second auth implementation.

```typescript
expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
  queryParams: {returnUrl: '/app/catalog/000000000000000000000001'}
});
expect(reader.reserve).not.toHaveBeenCalled();
```

- Run login/register/return-route specs and verify the current dropped-return behavior fails.
- Inject ActivatedRoute into RegisterComponent. Forward only the sanitized returnUrl on success and both manual form switches. After successful login use the existing role-aware helper. With no destination preserve the existing role landing. Keep book availability fetched on the newly activated detail route.
- Repeat focused tests. Commit `feat: preserve book destinations through registration`.

## Task 6 — Integrated journeys and delivery evidence

**Files:** create `e2e/public-discovery.spec.ts`; update affected `e2e/quality.spec.ts`, `profile.spec.ts`, `sidebar-account.spec.ts` only where root/logout behavior intentionally changes. Update both `docs/phase5-quality.md`, global `avances-actuales.md`, and this plan's ledger. Update `.github/workflows/e2e.yml` backend pin only after a compatible backend commit is published under authorized workflow.

- Before product completion, add failing journeys against the marker-verified local QA host: root and direct book links anonymous; no private calls; digital/physical reserve and save prompts; one modal; cancel/Escape/focus; registration/login/return; zero automatic mutation; private URL redirects; logout then another account; last-copy taken during login.

```typescript
await page.goto('/');
await expect(page).toHaveURL(/\/app\/discover$/);
await page.goto(`/app/catalog/${fixture.books[0].id}`);
await page.getByRole('button', {name: 'Guardar', exact: true}).click();
await expect(page.getByRole('dialog')).toHaveCount(1);
await page.getByRole('button', {name: 'Seguir explorando'}).click();
await expect(page.getByRole('dialog')).toHaveCount(0);
```

- Verify public API active filtering and protected endpoints with real JWT/anonymous HTTP, beyond mocked store tests. Use generated fictitious accounts; no shared profile mutations and no Atlas connection.
- Run `dotnet test WebAppBookLibrary.sln -c Release` with BOOK_LIBRARY_TEST_MONGO_URI set to the isolated replica set. Require no omitted tests. Run `npm test -- --watch=false --browsers=ChromeHeadless`, `npm run test:reduced-motion`, `npm run build -- --configuration production`, and `npx playwright test`. Record actual results, not the previous suite counts.
- Inspect screenshots at 360×800, 768×1024, 1366×768, 1920×1080 in both themes, scrolled and unscrolled. Check modal boundaries, mobile authentication controls, focus restoration and axe results. CSS zoom is not a substitute for actual browser zoom.
- Perform one final independent branch review if native execution is selected, as required by executing-plans; reproduce and fix concrete findings, rerun affected checks. Do not spawn implementation agents without the selected workflow.
- Update evidence, spec status and global advances. Commit verified task changes separately from pre-existing logout fixes. No release/phase-5 closure claim for unexecuted staging/manual gates. Stop only owned QA processes and preserve user services.

## Self-review and pending handoff

The ten acceptance criteria map to Tasks 1–6: public API/routing (1/2), prompts/navigation (3), state/security (4), return and stock (5/6), and viewport/role evidence (6). All five review risks have assigned tests. Existing JWT policies and no-auto-action behavior remain unchanged. Native execution is recommended because the tasks share route/session interfaces; it avoids concurrent edits to those files. Native execution was authorized by the subsequent user messages; see the execution ledger above.
