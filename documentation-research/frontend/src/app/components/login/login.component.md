# login.component.ts

`app-login`, routed at `/login`. Enter an adventurer name, then pick a campaign slot or start a new one.

## Behavior
- No profile: shows a name field. `login()` calls `AuthService.login`, and a profile with no campaigns goes straight to `/characters`.
- Has a profile: lists `CampaignSlot`s. Clicking one opens `/game/<sessionId>`. There are also **New Campaign**, delete slot (local only), and **Switch Adventurer** (`logout`).

## Connections
**Parents (used by):**
- [../../app.routes.md](../../app.routes.md): `login`

**Children (uses):**
- [../../services/auth.service.md](../../services/auth.service.md)
- [../../models/game.models.md](../../models/game.models.md): `CampaignSlot`
- Styling: [../../../styles.md](../../../styles.md)
