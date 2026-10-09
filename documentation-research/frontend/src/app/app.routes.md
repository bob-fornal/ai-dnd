# app.routes.ts

Route table. Every page is lazy-loaded with `loadComponent`.

| Path | Component | Guard |
|---|---|---|
| `''` | redirects to `login` | none |
| `login` | `LoginComponent` | none |
| `characters` | `CharacterCreationComponent` | `authGuard` |
| `game/:sessionId` | `GameConsoleComponent` | `authGuard` |
| `**` | redirects to `login` | none |

## Rules
- `game/:sessionId` uses the **Worker session id**, not the character id. The console gets the character from the session.

## Connections
**Parents (used by):**
- [app.config.md](app.config.md)

**Children (uses):**
- [services/auth.guard.md](services/auth.guard.md)
- [components/login/login.component.md](components/login/login.component.md)
- [components/character-creation/character-creation.component.md](components/character-creation/character-creation.component.md)
- [components/game-console/game-console.component.md](components/game-console/game-console.component.md)
