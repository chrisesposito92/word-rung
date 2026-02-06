# AGENTS.md

## Purpose
This repository contains **Word Rung**, a daily word-ladder puzzle game with:
- player gameplay UI
- optional Supabase auth/stats
- daily leaderboard
- passcode-protected admin scheduler

Use this file as the operational guide for future coding sessions.

## Current Product Rules (Do Not Regress)
1. Anyone can play without signing in.
2. Signing in is optional and only improves identity continuity for stats.
3. A run can be finished manually even if not all ladders are solved.
4. Unsolved ladders score `0` when a run is finished.
5. If all ladders are solved, the run auto-finishes.
6. Admin puzzle generation must remain constrained to **1-10 puzzles** per request.
7. Admin must support viewing scheduled puzzles with pagination and optional `fromDate` filter.
8. Game UI must support both dark and light theme, with in-browser preference persistence.
9. Timed runs must start only after an explicit user action, and ladders stay hidden before start.
10. Automated Playwright identities (for example `Playwright*`) must not appear in daily leaderboard output.

## Tech Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase (DB + optional auth)
- Vitest (unit)
- Playwright (e2e)

## Key Paths
- Player page: `src/app/page.tsx`
- Admin page: `src/app/admin/page.tsx`
- Game UI logic: `src/components/game/GameClient.tsx`
- Admin UI logic: `src/components/admin/AdminClient.tsx`
- Game engine: `src/lib/game/*`
- Repository/data bridge: `src/lib/data/repository.ts`
- Supabase clients/types: `src/lib/supabase/*`
- Supabase migrations: `supabase/migrations/*`
- API routes: `src/app/api/**/route.ts`
- Unit tests: `tests/unit/*`
- E2E tests: `tests/e2e/*`

## API Surface
Player-facing:
- `GET /api/puzzle/today`
- `GET /api/leaderboard`
- `POST /api/submissions`
- `GET /api/stats`

Admin-facing:
- `GET /api/admin/session`
- `POST /api/admin/session`
- `DELETE /api/admin/session`
- `POST /api/admin/generate`
- `GET /api/admin/puzzles`
- `POST /api/admin/reassign`

## Runtime Modes
### Supabase mode
Enabled when all are present:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Local mode (fallback)
If Supabase env vars are missing:
- game/admin still work
- data is in-memory and resets on server restart
- admin list no longer auto-seeds; generation must be explicit

## Environment Variables
See `.env.example`.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSCODE`
- `ALLOW_DEBUG_PUZZLE` (debug/testing use only)

## Database Workflow
- Canonical migration history lives in `supabase/migrations/`.
- Apply pending schema changes with `supabase db push` (after `supabase link`).
- `docs/supabase-schema.sql` is a manual SQL Editor fallback for bootstrap/recovery.

## Required Commands Before Completion
1. `npm run lint`
2. `npm run typecheck`
3. `npm test`

## CI Checks
- GitHub Actions workflow: `.github/workflows/pr-checks.yml`
- Runs on: pull requests and pushes to `main`
- Jobs: lint/typecheck, unit tests, Playwright e2e

## E2E Caveat
Playwright uses the Next dev server. If e2e fails with a `.next/dev/lock` error, there is usually another active dev server process. Ensure only one dev server is active before rerunning tests.

## Documentation Maintenance Contract
When behavior changes, update:
- `README.md`
- relevant files under `docs/`
- this file (`AGENTS.md`)
- `CLAUDE.md` if operational expectations changed

## Change Safety Checklist
Before merging gameplay/admin changes, verify:
1. unauthenticated users can still play and submit
2. manual finish flow still works
3. leaderboard submission still occurs on run completion
4. admin generate/reassign and pagination still work
5. timed start gate still hides ladders before run start
6. automated Playwright identities are hidden from daily leaderboard results
7. tests cover the changed path
