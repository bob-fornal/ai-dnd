# app.component.ts

The root shell component (`app-root`). It only renders `<router-outlet />` at full viewport height.

Files: `.ts`, `.html`, `.css`, `.spec.ts`

Tests (`.spec.ts`, Jasmine/Karma via `npm test`): creates; renders a router outlet.

## Connections
**Parents (used by):**
- [../main.md](../main.md): bootstrap component

**Children (uses):**
- Routed components, through `RouterOutlet`; see [app.routes.md](app.routes.md)
