# Admin Portal

## URL
- `/admin`

## Access
The portal is protected by passcode.

Environment variable:
- `ADMIN_PASSCODE`

If unset, local default is `codex-admin`.

## Capabilities
1. Generate and schedule puzzles for sequential dates.
2. Generate 1 to 10 puzzles at a time.
3. Optionally overwrite existing date assignments.
4. Reassign an existing puzzle to a different date.
5. Browse all scheduled puzzles with pagination.
6. Filter the browse view by optional `from date`.
7. View the current `last scheduled date`.

## API routes
- `GET /api/admin/session`
- `POST /api/admin/session`
- `DELETE /api/admin/session`
- `POST /api/admin/generate`
- `GET /api/admin/puzzles`
- `POST /api/admin/reassign`

## Local mode behavior
Without Supabase credentials, the admin portal uses in-memory storage.
This is ideal for development/tests but not persistent across server restarts.

Unlike earlier behavior, the admin list does not auto-seed generated puzzle rows in local mode.
Use the Generate action to add schedules explicitly.
