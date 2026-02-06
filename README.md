# Word Rung

Word Rung is a daily word-ladder puzzle game designed for quick, satisfying puzzle sessions.

Each daily puzzle contains **3 ladders**. You connect each start word to its end word by changing one letter at a time while staying inside the dictionary.

## Features
- Daily 3-ladder puzzle
- Scored gameplay (moves, hints, and time matter)
- Explicit start button for fair timed runs
- Light/dark theme toggle (saved in browser local storage)
- Optional auth for persistent identity/stats
- Daily global leaderboard
- Admin portal for scheduling and reassigning puzzles
- Local fallback mode when Supabase is not configured

## How Gameplay Works
- Click **Start timed run** to reveal ladders and begin the timer.
- You can solve all 3 ladders, or finish early.
- If you finish early, unsolved ladders score `0`.
- If all ladders are solved, the run auto-finishes.
- Finishing a run submits your score to the leaderboard and updates stats.
- Players can switch between dark and light mode from the game header.

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase
- Vitest + Playwright

## Quick Start
```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:
- Game: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Environment Variables
Defined in `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSCODE`
- `ALLOW_DEBUG_PUZZLE` (debug/testing only)

## Supabase Setup
1. Create a Supabase project.
2. Link CLI once: `supabase link --project-ref <your-project-ref>`.
3. Apply baseline + pending migrations: `supabase db push`.
4. Set env vars in `.env.local` (and in Vercel for production).

Migration workflow:
- Baseline migration file: `supabase/migrations/20260206210940_initial_schema.sql`
- Create future migrations with `supabase migration new <name>`, then run `supabase db push`.
- `docs/supabase-schema.sql` remains available for manual SQL Editor fallback.

If Supabase env vars are missing, the app runs in local in-memory mode.

## Admin Portal
Path: `/admin`

Capabilities:
- Generate and schedule **1-10** puzzles starting from a date
- Optional overwrite of existing date assignments
- Reassign puzzle dates
- Browse scheduled puzzles with pagination
- Optional `from date` filter
- Visibility into current last scheduled date

Details: `docs/admin-portal.md`

## Commands
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`
- `npm test`
- `npm run generate:word-list`

## Testing (Required)
Before considering changes complete:
```bash
npm run lint
npm run typecheck
npm test
```

## Deploying to Vercel
1. Push to GitHub.
2. Import the repo in Vercel.
3. Add production env vars from `.env.example`.
4. Deploy.

## Project Structure
- `src/app/` routes and API handlers
- `src/components/game/` gameplay UI
- `src/components/admin/` admin UI
- `src/lib/game/` puzzle generation/validation/scoring
- `src/lib/data/repository.ts` Supabase/local data bridge
- `src/lib/supabase/` Supabase clients/types
- `tests/unit/` unit tests
- `tests/e2e/` Playwright tests
- `docs/` feature and operational documentation

## Additional Documentation
- `docs/game-design.md`
- `docs/admin-portal.md`
- `docs/testing.md`
- `docs/supabase-schema.sql`
- `supabase/migrations/`
- `AGENTS.md`
- `CLAUDE.md`
