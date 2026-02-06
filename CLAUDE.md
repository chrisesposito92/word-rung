# CLAUDE.md

## Mission
Build and maintain Word Rung as a production-ready daily puzzle game.

## Non-negotiables
1. Preserve daily puzzle determinism in generator behavior.
2. Keep gameplay available without authentication.
3. Keep auth optional for account-linked stats.
4. Keep admin tooling capable of generating 1-10 puzzles and reassigning dates.
5. Do not merge changes without passing lint, typecheck, unit tests, and Playwright e2e.
6. Preserve player-selectable dark/light theme support in game UI.

## Key Files
- Game loop: `/Users/chrisesposito/Documents/github/word-rung/src/components/game/GameClient.tsx`
- Admin loop: `/Users/chrisesposito/Documents/github/word-rung/src/components/admin/AdminClient.tsx`
- Game generation: `/Users/chrisesposito/Documents/github/word-rung/src/lib/game/generator.ts`
- Validation/scoring: `/Users/chrisesposito/Documents/github/word-rung/src/lib/game/validator.ts`, `/Users/chrisesposito/Documents/github/word-rung/src/lib/game/scoring.ts`
- Data bridge: `/Users/chrisesposito/Documents/github/word-rung/src/lib/data/repository.ts`

## Deployment Model
- Main app intended for Vercel.
- Persistence and auth expected through Supabase.
- Local mode must remain functional for development and tests.

## Docs
- Feature docs live in `/Users/chrisesposito/Documents/github/word-rung/docs/`.
- Database SQL source of truth: `/Users/chrisesposito/Documents/github/word-rung/docs/supabase-schema.sql`.
