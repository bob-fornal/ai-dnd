# routes/quest.ts

Quest endpoints: AI-generated quests and the seeded quest list.

## Endpoints
| Method & path | Body / query | Response |
|---|---|---|
| `POST /api/quest/generate` | `{ sessionId, characterId }` | `{ quest: GeneratedQuest }` |
| `GET /api/quest/list` | `?level=1` | `{ quests }` where `level_min <= level <= level_max` |

## Rules
- `generate` replaces `session.activeQuestSummary` with the new quest's description. It doesn't write to the `quests` table or change `activeQuestId`.

## Gotchas
- `generate` doesn't catch a malformed JSON body (it falls through to the global 500 handler).
- With llama-3.3 the generated quest is usually the canned "Blood on the Road" ([services/ai-dm.md](../services/ai-dm.md)).
- No UI calls these endpoints yet. `generateQuest` exists in the API service but nothing uses it.

## Connections
**Parents (used by):**
- [../index.md](../index.md): mounted at `/api/quest`
- HTTP client method: [game-api.service.md](../../../frontend/src/app/services/game-api.service.md) (`generateQuest`)

**Children (uses):**
- [services/character.md](../services/character.md): `getCharacter`
- [services/session.md](../services/session.md): `loadSession`, `saveSession`, `rebuildSession`
- [services/ai-dm.md](../services/ai-dm.md): `generateQuest`
- [types/index.md](../types/index.md): `Env`
