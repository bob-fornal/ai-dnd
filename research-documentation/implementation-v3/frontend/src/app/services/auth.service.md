# services/auth.service.ts

A local, name-only "account" kept in `localStorage`. It holds the user's campaign slots, which point at Worker sessions and characters.

<!-- anchors:start -->
Anchors (`auth.service.ts`): `AuthService:7`, `isLoggedIn():12`, `login():16`, `logout():31`, `addCampaign():36`, `updateCampaign():44`, `removeCampaign():54`
<!-- anchors:end -->

## Key exports
| Member | Purpose |
|---|---|
| `profile` | Read-only signal of `UserProfile` or `null` |
| `isLoggedIn()` | `profile() !== null` |
| `login(username)` | Loads `ai_dnd_user_<name>` or creates an empty profile |
| `logout()` | Clears the active profile (keeps the per-user copy) |
| `addCampaign` / `updateCampaign` / `removeCampaign` | Manage `CampaignSlot`s and persist them |

## Storage keys
- `ai_dnd_user`: the currently active profile (restored on reload).
- `ai_dnd_user_<lowercase name>`: each user's saved profile.

## Rules & gotchas
- Campaigns exist only in this browser. Clearing storage loses the links to server sessions; the D1 data stays, but nothing points to it.
- `removeCampaign` only deletes the slot. It doesn't delete the character on the server.
- The slot's `location` is set once at creation and never updated.

## Connections
**Parents (used by):**
- [auth.guard.md](auth.guard.md)
- [login.component.md](../components/login/login.component.md)
- [character-creation.component.md](../components/character-creation/character-creation.component.md): `addCampaign`
- [game-console.component.md](../components/game-console/game-console.component.md): `updateCampaign`

**Children (uses):**
- [../models/game.models.md](../models/game.models.md): `UserProfile`, `CampaignSlot`
