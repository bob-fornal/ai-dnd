# character-creation.component.ts

`app-character-creation`, routed at `/characters`. A four-step Material stepper: Identity (name and roll method), Race, Class, then Review.

Files: `.ts`, `.html`, `.css`, `.spec.ts`

## Behavior
- `createCharacter()` calls `GameApiService.createCharacter`, then:
  1. `CharacterStateService.setCharacter(res.character)`
  2. `AuthService.addCampaign(...)` with a new `slotId` and the returned `sessionId`/`characterId`
  3. Navigates to `/game/<sessionId>`, passing `startNarrative` and `backstory` in **router state**
- While waiting it shows a full-screen spinner. Errors show `err.error.error`.

## Gotchas
- The race bonus and hit-die labels are **hard-coded copies** of the Worker rules. Update them alongside [worker types](../../../../../worker/src/types/index.md).
- The slot location is hard-coded to the starting inn.

## Connections
**Parents (used by):**
- [../../app.routes.md](../../app.routes.md): `characters`

**Children (uses):**
- [../../services/game-api.service.md](../../services/game-api.service.md): `createCharacter`
- [../../services/auth.service.md](../../services/auth.service.md): `addCampaign`
- [../../services/character-state.service.md](../../services/character-state.service.md): `setCharacter`
- [../../models/game.models.md](../../models/game.models.md): `Race`, `CharacterClass`
- Hands off to [../game-console/game-console.component.md](../game-console/game-console.component.md) through router state
- Spec: [PRD §4.1](../../../../../PRD.md#41-character-creation)
