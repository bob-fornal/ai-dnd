# index.ts

The Worker entry point. It builds the Hono app, applies global middleware, and mounts every route group under `/api/*`.

## Responsibilities
- Request logging (`hono/logger`).
- CORS for `http://localhost:4200`, `*.pages.dev`, and `*.workers.dev`.
- `GET /api/health` returns `{ status, timestamp }`.
- JSON 404 fallback and a JSON 500 error handler.

## Route mounts
| Prefix | Router |
|---|---|
| `/api/character` | `characterRoutes` |
| `/api/action` | `actionRoutes` |
| `/api/combat` | `combatRoutes` |
| `/api/session` | `sessionRoutes` |
| `/api/log` | `logRoutes` |
| `/api/shop` | `shopRoutes` |
| `/api/levelup` | `levelUpRoutes` |
| `/api/quest` | `questRoutes` |

## Rules & gotchas
- CORS uses an `origin` **function**. Hono matches array entries as exact strings, so wildcards don't work there. See [DEPLOYMENT_NOTES §4](../../docs/DEPLOYMENT_NOTES.md#4-cors).
- Adding a new frontend origin means editing the CORS function.
- Bindings (`AI`, `SESSION_KV`, `DB`, `ENVIRONMENT`) are declared in `worker/wrangler.toml` and typed as `Env`.

## Connections
**Parents (used by):**
- Wrangler (`main = "src/index.ts"` in `worker/wrangler.toml`)

**Children (uses):**
- [types/index.md](types/index.md): `Env`
- [routes/character.md](routes/character.md)
- [routes/action.md](routes/action.md)
- [routes/combat.md](routes/combat.md)
- [routes/session.md](routes/session.md)
- [routes/log.md](routes/log.md)
- [routes/shop.md](routes/shop.md)
- [routes/levelup.md](routes/levelup.md)
- [routes/quest.md](routes/quest.md)
