# routes/log.ts

`GET /api/log/:sessionId?page=0&limit=20` returns the adventure log one page at a time.

## Response
`{ entries: [{ id, actor, content, created_at }], total, page, limit }`

## Rules
- `limit` is clamped to 1..50 (default 20) and `page` to 0 or more.
- The query sorts by `created_at DESC` for paging, then reverses each page so the entries come back oldest first.
- Page 0 is the **newest** entries. Higher pages go further back in time.

## Gotchas
- `created_at` only has one-second resolution, so a player turn and its DM turn can share a timestamp and their order within a page isn't guaranteed.

## Connections
**Parents (used by):**
- [../index.md](../index.md): mounted at `/api/log`
- Called over HTTP by [game-api.service.md](../../../frontend/src/app/services/game-api.service.md) (`getLog`)

**Children (uses):**
- [types/index.md](../types/index.md): `Env`
- Tables: `adventure_log` ([schema](../../migrations/0001_initial_schema.md)). Rows are written by [action](action.md), [combat](combat.md), and [levelup](levelup.md)
