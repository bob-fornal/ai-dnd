# services/game-api.service.ts

The single HTTP client for the Worker API. Each method maps one-to-one onto an endpoint, with `API_BASE` taken from `environment.apiUrl`.

<!-- anchors:start -->
Anchors (`game-api.service.ts`): `GameApiService:17`, `createCharacter():21`, `getCharacter():36`, `sendAction():41`, `resolveCombat():50`, `getSession():62`, `getLog():67`, `levelUp():74`, `generateQuest():85`, `getInventory():90`, `equipItem():96`, `dropItem():100`, `getShop():105`, `shopTransaction():109`
<!-- anchors:end -->

## Methods to endpoints
| Method | HTTP | Worker doc |
|---|---|---|
| `createCharacter(body)` | `POST /api/character/create` | [character](../../../../worker/src/routes/character.md) |
| `getCharacter(id)` | `GET /api/character/:id` | [character](../../../../worker/src/routes/character.md) |
| `getInventory(id)` | `GET /api/character/:id`, then maps to `{ inventory }` | [character](../../../../worker/src/routes/character.md) |
| `equipItem(id, itemId, equipped)` | `PATCH /api/character/:id/equip` | [character](../../../../worker/src/routes/character.md) |
| `dropItem(id, itemId)` | `DELETE /api/character/:id/inventory/:itemId` | [character](../../../../worker/src/routes/character.md) |
| `sendAction(sid, cid, action)` | `POST /api/action` | [action](../../../../worker/src/routes/action.md) |
| `resolveCombat(sid, cid, action, itemId?)` | `POST /api/combat/resolve` | [combat](../../../../worker/src/routes/combat.md) |
| `getSession(sid)` | `GET /api/session/:id` | [session](../../../../worker/src/routes/session.md) |
| `getLog(sid, page, limit)` | `GET /api/log/:sessionId` | [log](../../../../worker/src/routes/log.md) |
| `levelUp(sid, cid, ability)` | `POST /api/levelup` | [levelup](../../../../worker/src/routes/levelup.md) |
| `generateQuest(sid, cid)` | `POST /api/quest/generate` | [quest](../../../../worker/src/routes/quest.md) *(unused)* |
| `getShop(id)` / `shopTransaction(body)` | `GET /api/shop/:id` / `POST /api/shop/transaction` | [shop](../../../../worker/src/routes/shop.md) *(unused)* |

## Rules & gotchas
- No caching and no error mapping. Callers handle `err.error.error`.
- Several methods are typed `any`. When you tighten a type, put the response interface in [game.models.md](../models/game.models.md).

## Connections
**Parents (used by):**
- [character-creation.component.md](../components/character-creation/character-creation.component.md): `createCharacter`
- [game-console.component.md](../components/game-console/game-console.component.md): session, action, combat, log, level-up, inventory
- [inventory.component.md](../components/inventory/inventory.component.md): `getInventory`, `equipItem`, `dropItem`

**Children (uses):**
- [../models/game.models.md](../models/game.models.md)
- [../../environments/environment.md](../../environments/environment.md): `apiUrl`
