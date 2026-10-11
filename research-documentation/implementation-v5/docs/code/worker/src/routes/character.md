# routes/character.ts

Code: [`character.ts`](../../../../../worker/src/routes/character.ts)

Character creation, lookup, and inventory management.

<!-- anchors:start -->
Anchors (`character.ts`): `characterRoutes:8`
<!-- anchors:end -->

## Endpoints
| Method & path | Body | Response |
|---|---|---|
| `POST /api/character/create` | `{ name, race, class, abilityRollMethod? }` | `{ characterId, sessionId, character, backstory, startNarrative }` |
| `GET /api/character/:id` | none | `{ character, inventory, activeQuest }` |
| `PATCH /api/character/:id/equip` | `{ itemId: number, equipped: boolean }` | `{ success, inventory }` |
| `DELETE /api/character/:id/inventory/:itemId` | none | `{ success, inventory }` (removes one unit) |

## Rules & gotchas
- Create: name is required, at most 40 characters, with `< > ' "` stripped. `abilityRollMethod` defaults to `standard`.
- Create makes a **new `sessionId`** (UUID), saves a `newSession` to KV, and asks for a best-effort AI backstory.
- `startNarrative` is fixed opening text set in Aethermoor, plus the backstory.
- Equip: equipping a weapon or armor first unequips any equipped item of the same type.
- `activeQuest` on GET is always quest id `1`. It ignores the session's quest ([bugs.md B-06](../../../../../../../bugs.md)).
- The equip query aliases the table in `UPDATE character_inventory ci …`, which SQLite may reject. Check this if equipping errors ([bugs.md B-13](../../../../../../../bugs.md)).
- Equipped state is display-only; combat ignores it ([services/combat.md](../services/combat.md)).

## Connections
**Parents (used by):**
- [../index.md](../index.md): mounted at `/api/character`
- Called over HTTP by [game-api.service.md](../../../frontend/src/app/services/game-api.service.md) (`createCharacter`, `getCharacter`, `getInventory`, `equipItem`, `dropItem`)

**Children (uses):**
- [services/character.md](../services/character.md): `createCharacter`, `getCharacter`, `getInventory`
- [services/session.md](../services/session.md): `newSession`, `saveSession`
- [services/ai-dm.md](../services/ai-dm.md): `generateBackstory`
- [types/index.md](../types/index.md): `Env`, `CreateCharacterBody`
