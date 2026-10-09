# services/auth.guard.ts

`authGuard`, a functional `CanActivateFn`. It allows the route when `AuthService.isLoggedIn()` is true and otherwise redirects to `/login`.

## Gotchas
- This is a "login" with a local profile name only. There's no server auth and no password ([auth.service.md](auth.service.md)).

## Connections
**Parents (used by):**
- [../app.routes.md](../app.routes.md): `characters`, `game/:sessionId`

**Children (uses):**
- [auth.service.md](auth.service.md)
