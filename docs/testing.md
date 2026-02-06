# Testing

## Test suites
- Unit tests: Vitest (`tests/unit`)
- E2E tests: Playwright (`tests/e2e`)

## Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`
- `npm test` (unit + e2e)

## E2E notes
Playwright launches the Next dev server automatically from `playwright.config.ts`.
The config sets:
- `ADMIN_PASSCODE=codex-admin`
- `ALLOW_DEBUG_PUZZLE=true`

This allows tests to:
- login to `/admin`
- validate the timed start gate, then full gameplay completion flow using in-app hint/check actions
