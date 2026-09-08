# BookLibrary Client

Angular 20 single-page application for the BookLibrary API. It demonstrates authenticated navigation, role-aware library workflows, typed HTTP contracts, and a transparent security verification dashboard.

## Highlights

- Angular 20, TypeScript, RxJS, and Angular Material
- JWT authentication with expiration checks and automatic cleanup on `401`
- Public registration cannot choose privileged roles
- Lazy-loaded catalog, loans, logs, and authentication features
- Reader workspace with discovery, server-driven catalog, book details, favorites, personal library, and read-only profile
- Centralized API error normalization
- Security dashboard based on real HTTP probes—no random scores or simulated findings
- Unit tests for authentication, interception, API services, token parsing, errors, and security probes
- Production dependency audit currently reports zero known vulnerabilities

## Run locally

Requirements: Node.js 20.19+ or 22.12+ and npm. Start the backend at `https://localhost:7086`, then run:

```bash
npm ci
npm start
```

Open `http://localhost:4200`. Requests to `/api` are forwarded by `proxy.conf.json`; no frontend `.env` file is required.

## Commands

```bash
npm test -- --watch=false --browsers=ChromeHeadless
npm run build -- --configuration production
npm audit --omit=dev
```

GitHub Actions runs install, headless tests, production build, and the production dependency audit on pushes and pull requests.

## Product behavior

- Readers land on `/app/discover`, browse `/app/catalog`, open `/app/books/:id`, reserve available books, manage `/app/favorites`, review `/app/my-library`, and inspect `/app/profile`.
- Catalog search, filters, sorting, and pagination are encoded in the URL, so browser back/forward and shared local links preserve the current view.
- Physical reservations expose inventory and a 14-day due date. Digital reservations do not consume copies; an active reservation enables HTTPS resource access from the detail page or personal library.
- Favorite controls update optimistically and recover their previous state if the API rejects the change.
- Librarians manage the catalog and inspect all loans.
- Administrators additionally delete records, inspect audit logs, and run the security dashboard.
- Access control in the interface improves usability; the API remains the source of truth for authorization.

## Reader operation notes

- Start the API with the `https` launch profile because the Angular proxy targets `https://localhost:7086`.
- The catalog and personal library are server-paginated. The client requests all loan pages for the personal-library grouping and limits detail hydration concurrency.
- Digital resources only open when the API returns an absolute `https://` URL. The client does not persist or log that URL.
- Empty, partial-error, conflict, and retry states are intentional. An empty Atlas catalog cannot exercise a live reservation journey until staff adds active books.
- Profile data is read-only in this phase. Password changes, account deletion, DRM, waitlists, and offline reading remain out of scope.

## Honest security dashboard

The admin dashboard executes a small set of documented endpoint probes and reports `passed`, `failed`, `inconclusive`, or `unavailable`. Its score only includes conclusive probes. It is a runtime smoke check, not a vulnerability scanner or proof that the system is secure.

## Structure

```text
src/app/
├── core/       authentication, guards, interceptor, and API services
├── features/   auth, catalog, loans, logs, and security dashboard
└── shared/     reusable components, constants, and models
```

The related backend repository is [WebAppBookLibrary-Backend](https://github.com/AndrewMtz23/WebAppBookLibrary-Backend).
