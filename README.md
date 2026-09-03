# BookLibrary Client

Angular 20 single-page application for the BookLibrary API. It demonstrates authenticated navigation, role-aware library workflows, typed HTTP contracts, and a transparent security verification dashboard.

## Highlights

- Angular 20, TypeScript, RxJS, and Angular Material
- JWT authentication with expiration checks and automatic cleanup on `401`
- Public registration cannot choose privileged roles
- Lazy-loaded catalog, loans, logs, and authentication features
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

- Users browse the catalog, reserve available books, view their own loans, and return them.
- Librarians manage the catalog and inspect all loans.
- Administrators additionally delete records, inspect audit logs, and run the security dashboard.
- Access control in the interface improves usability; the API remains the source of truth for authorization.

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
