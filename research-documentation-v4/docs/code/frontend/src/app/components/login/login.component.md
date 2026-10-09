# login.component.ts

Code: [`login.component.ts`](../../../../../../../frontend/src/app/components/login/login.component.ts), [`login.component.html`](../../../../../../../frontend/src/app/components/login/login.component.html), [`login.component.css`](../../../../../../../frontend/src/app/components/login/login.component.css), [`login.component.spec.ts`](../../../../../../../frontend/src/app/components/login/login.component.spec.ts)

`app-login`, routed at `/login`. Enter an adventurer name, then pick a campaign slot or start a new one.

Files: `.ts`, `.html`, `.css`, `.spec.ts`

Tests (`.spec.ts`, Jasmine/Karma via `npm test`): creates; shows the name card with no profile; lists saved campaigns. `AuthService` is mocked.

<!-- anchors:start -->
Anchors (`login.component.ts`): `LoginComponent:25`, `login():33`, `newCampaign():47`, `resumeCampaign():51`, `deleteCampaign():55`, `switchUser():60`
<!-- anchors:end -->

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
