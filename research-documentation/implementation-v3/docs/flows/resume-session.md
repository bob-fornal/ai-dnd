# Flow: resuming a game (sessions and KV expiry)

How a saved campaign is reopened, and what happens when the Workers KV session has expired.

## Storage
- **KV** `session:<sessionId>` (`services/session.ts:8`): location, quest summary, combat state, last 20 history turns (`MAX_HISTORY`, `:5`). TTL **7 days** (`SESSION_TTL_SECONDS = 604800`, `:4`), reset on every `saveSession` (`:17-29`).
- **D1** `characters`, `character_inventory`, `adventure_log`: permanent.
- **Browser** `localStorage` campaign slots (`AuthService`, keys `ai_dnd_user` and `ai_dnd_user_<name>`) hold `sessionId` and `characterId`.

## Resume path
| Step | Where | What happens |
|---|---|---|
| 1 | `login.component.ts:51-52` `resumeCampaign(slot)` | Navigates to `/game/<sessionId>` (`authGuard` requires a local profile) |
| 2 | `game-console.component.ts:69-104` `ngOnInit` | No `startNarrative`, so it calls `GameApiService.getSession` (`game-api.service.ts:62`) |
| 3 | `GET /api/session/:id`, `worker/src/routes/session.ts:9` | `loadSession` (`:12`); if found, returns `{ session, character }` |
| 4 | `game-console.component.ts:81-98` | Sets the character, shows "You are in <location>", loads the inventory (`:93`) and log page 0 (`:98`) |

## When KV has expired
- `routes/session.ts:14` returns **404 "Session not found or expired"**. It imports `rebuildSession` but never calls it (B-07).
- The console shows "Could not load session" and stays empty, so **the game can't be resumed from the UI**, even though the D1 data still exists.
- The other routes (`action`, `combat`, `levelup`, `quest`) do call `rebuildSession` (`services/session.ts:58`): the last 20 `adventure_log` rows become history. Location becomes "Unknown — session rebuilt from log", the quest resets, and combat state is lost. They are never reached, because the console fails at step 3.
- **Fix:** in `routes/session.ts`, fall back to `rebuildSession` (it needs the `characterId`; take it from the frontend slot or look up `characters.session_id`).

## Docs
[services/session.md](../../worker/src/services/session.md) · [routes/session.md](../../worker/src/routes/session.md) · [game-console](../../frontend/src/app/components/game-console/game-console.component.md) · [auth.service](../../frontend/src/app/services/auth.service.md) · [login](../../frontend/src/app/components/login/login.component.md)
