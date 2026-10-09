# app.config.ts

Application-wide providers.

<!-- anchors:start -->
Anchors (`app.config.ts`): `appConfig:8`
<!-- anchors:end -->

## Providers
| Provider | Why |
|---|---|
| `provideZoneChangeDetection({ eventCoalescing: true })` | Standard zone setup |
| `provideRouter(routes, withHashLocation())` | **Hash URLs (`/#/game/…`)** so Cloudflare Pages never has to serve deep links |
| `provideHttpClient(withFetch())` | Used by [game-api.service.md](services/game-api.service.md) |
| `provideAnimationsAsync()` | Angular Material animations |

## Rules & gotchas
- Keep hash routing. Removing it breaks refreshes on deep links in Pages.

## Connections
**Parents (used by):**
- [../main.md](../main.md)

**Children (uses):**
- [app.routes.md](app.routes.md)
