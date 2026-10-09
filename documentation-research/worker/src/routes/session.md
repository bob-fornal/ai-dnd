# routes/session.ts

`GET /api/session/:id` returns the KV session plus the character it belongs to. The frontend uses it to resume a game.

## Response
`{ session: SessionData, character: Character | null }`, or 404 if the session isn't in KV.

## Gotchas
- `rebuildSession` is imported but **not** used. Once KV expires (7 days without play) this returns 404, so the game console can't resume, even though the other routes can rebuild the session ([bugs.md B-07](../../../bugs.md)).

## Connections
**Parents (used by):**
- [../index.md](../index.md): mounted at `/api/session`
- Called over HTTP by [game-api.service.md](../../../frontend/src/app/services/game-api.service.md) (`getSession`)

**Children (uses):**
- [services/session.md](../services/session.md): `loadSession`
- [services/character.md](../services/character.md): `getCharacter`
- [types/index.md](../types/index.md): `Env`
