# Recipe: adding an endpoint or feature

The files a new feature touches, in order. Example: **"rest at the inn"**, where the player pays gold to restore HP to full.

## Worker
| # | File | Change |
|---|---|---|
| 1 | `worker/src/types/index.ts` | Request body type, e.g. `RestBody { sessionId, characterId }`; a cost constant if needed |
| 2 | `worker/src/routes/<name>.ts` (new) | `export const restRoutes = new Hono<{ Bindings: Env }>()`. Validate the body, `getCharacter`, check `gold`, `updateCharacter(db, id, { hp: max_hp, gold: gold - cost })` (`services/character.ts:94`; whitelisted fields only). Optionally `askDM` for narration, `appendHistory` + `saveSession`, and an `adventure_log` insert, following `routes/action.ts` |
| 3 | `worker/src/index.ts:41-48` | `app.route('/api/rest', restRoutes)` |
| 4 | Logic shared by several routes | Put it in `worker/src/services/*.ts`, not the route |
| 5 | Schema change? | Add a **new** `worker/migrations/000N_*.sql`; never edit `0001` |

## Frontend
| # | File | Change |
|---|---|---|
| 6 | `frontend/src/app/models/game.models.ts` | Response interface (mirror the Worker types) |
| 7 | `frontend/src/app/services/game-api.service.ts` | Method, e.g. `rest(sessionId, characterId)` posting to `${API_BASE}/api/rest` |
| 8 | Component (usually `game-console.component.ts` + `.html`) | Button and handler: call the API, then `CharacterStateService.setCharacter(res.updatedCharacter)` so the sheet updates; push a system or narrative entry |
| 9 | `frontend/src/app/components/<x>/<x>.component.spec.ts` | Tests with `GameApiService` as a Jasmine spy |

## Docs to update (same change)
- The doc beside every changed file, plus links on both ends ([AUTHORING](../AUTHORING.md) §3).
- [code.md](../../code.md) entry for any new doc; re-run `research-work/scripts/build-symbol-index.mjs` so the symbol index and anchors stay correct.
- [PRD.md](../PRD.md) §9 API spec; the routing table in [AGENTS.md](../../AGENTS.md) if a new feature area appears.

## Rules to keep
- The Worker owns the rules: costs, HP math, and dice happen in Worker code; the AI only narrates.
- CORS: new frontend origins go in `worker/src/index.ts:19-35` (the `cors({ origin: (origin) => … })` function at `:21`).
- Angular components are split into `.ts`, `.html`, `.css`, `.spec.ts`; never inline templates.

## Docs
[index.md](../../worker/src/index.md) · [routes/action.md](../../worker/src/routes/action.md) (template route) · [services/character.md](../../worker/src/services/character.md) · [game-api.service](../../frontend/src/app/services/game-api.service.md) · [game-console](../../frontend/src/app/components/game-console/game-console.component.md) · [character-state.service](../../frontend/src/app/services/character-state.service.md)
