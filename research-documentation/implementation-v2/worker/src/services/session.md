# services/session.ts

Reads and writes the per-game session document in Workers KV, with a D1 fallback for when KV has expired.

<!-- anchors:start -->
Anchors (`session.ts`): `sessionKey:8`, `loadSession:11`, `saveSession:17`, `newSession:32`, `appendHistory:46`, `rebuildSession:58`
<!-- anchors:end -->

## Key exports
| Name | Purpose |
|---|---|
| `sessionKey(id)` | KV key: `session:<id>` |
| `loadSession(kv, id)` | Returns `SessionData` or `null` |
| `saveSession(kv, id, data)` | Trims history to 20 turns and writes it with a 7-day TTL |
| `newSession(characterId)` | Starting state: Rusty Flagon Inn, quest id `4` ("Shadows in the Inn") |
| `appendHistory(session, role, text)` | Pushes one turn and trims to 20 |
| `rebuildSession(db, characterId, sessionId)` | Rebuilds history from the last 20 `adventure_log` rows |

## Rules & gotchas
- Every `saveSession` resets the TTL, so a session only expires after 7 days without play.
- A rebuilt session loses location, quest, and combat state (location becomes "Unknown — session rebuilt from log", `inCombat` becomes false).
- `rebuildSession` casts the `actor` column to the history role, so `system` rows pass through as-is.
- `newSession` hard-codes quest id `4`, so the seed order matters ([seed.md](../db/seed.md)).
- Only the last 10 of the 20 stored turns go into the prompt ([ai-dm.md](ai-dm.md)).

## Connections
**Parents (used by):**
- [routes/action.md](../routes/action.md), [routes/combat.md](../routes/combat.md), [routes/levelup.md](../routes/levelup.md), [routes/quest.md](../routes/quest.md): load, save, rebuild
- [routes/character.md](../routes/character.md): `newSession`, `saveSession`
- [routes/session.md](../routes/session.md): `loadSession`, `rebuildSession` (imported but not called)

**Children (uses):**
- [types/index.md](../types/index.md): `SessionData`, `HistoryTurn`
- Tables: `adventure_log` ([schema](../../migrations/0001_initial_schema.md))
