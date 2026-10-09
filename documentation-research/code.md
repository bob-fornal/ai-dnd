# Code Documentation Index

Start here. Find the area you're working on, open its doc, and follow that doc's **Connections** links. The rules for keeping this index current are in [AGENT.md](AGENT.md).

## Shared documentation
- [PRD.md](PRD.md): product requirements, data model, API spec, prompt design
- [SETUP.md](SETUP.md): local development and deployment steps
- [docs/DEPLOYMENT_NOTES.md](docs/DEPLOYMENT_NOTES.md): production issues hit while shipping, with fixes
- [bugs.md](bugs.md): known bugs (B-01 to B-14) with location, cause, and affected docs

## Worker: entry & types
- [worker/src/index.md](worker/src/index.md): Hono app, CORS, health check, mounts all `/api/*` routes
- [worker/src/types/index.md](worker/src/types/index.md): shared types, bindings, D&D rule constants

## Worker: routes
- [worker/src/routes/action.md](worker/src/routes/action.md): `POST /api/action`, main loop for free-form actions
- [worker/src/routes/character.md](worker/src/routes/character.md): create, get, equip, and drop for characters
- [worker/src/routes/combat.md](worker/src/routes/combat.md): `POST /api/combat/resolve`, one round resolved then narrated
- [worker/src/routes/levelup.md](worker/src/routes/levelup.md): `POST /api/levelup`, level gain plus ability increase
- [worker/src/routes/log.md](worker/src/routes/log.md): `GET /api/log/:sessionId`, paginated adventure log
- [worker/src/routes/quest.md](worker/src/routes/quest.md): AI quest generation and seeded quest list
- [worker/src/routes/session.md](worker/src/routes/session.md): `GET /api/session/:id`, resume a game
- [worker/src/routes/shop.md](worker/src/routes/shop.md): shop listing and buy/sell transactions

## Worker: services
- [worker/src/services/ai-dm.md](worker/src/services/ai-dm.md): all Workers AI calls, prompts, JSON validation
- [worker/src/services/character.md](worker/src/services/character.md): character creation, update, inventory, leveling rules
- [worker/src/services/combat.md](worker/src/services/combat.md): monster selection, round resolution, loot
- [worker/src/services/dice.md](worker/src/services/dice.md): server-side dice engine and modifiers
- [worker/src/services/session.md](worker/src/services/session.md): KV session load/save, history, D1 rebuild

## Worker: data
- [worker/migrations/0001_initial_schema.md](worker/migrations/0001_initial_schema.md): D1 tables and columns
- [worker/src/db/seed.md](worker/src/db/seed.md): reference data and the row IDs the code relies on

## Frontend: app shell
- [frontend/src/main.md](frontend/src/main.md): bootstrap and the `index.html` host page
- [frontend/src/styles.md](frontend/src/styles.md): global M3 theme, CSS variables, utility classes
- [frontend/src/environments/environment.md](frontend/src/environments/environment.md): build-time API URL and Pages config
- [frontend/src/app/app.component.md](frontend/src/app/app.component.md): root shell with router outlet
- [frontend/src/app/app.config.md](frontend/src/app/app.config.md): providers, hash routing, HttpClient
- [frontend/src/app/app.routes.md](frontend/src/app/app.routes.md): lazy routes and guards

## Frontend: components
- [frontend/src/app/components/login/login.component.md](frontend/src/app/components/login/login.component.md): name entry and campaign slot picker
- [frontend/src/app/components/character-creation/character-creation.component.md](frontend/src/app/components/character-creation/character-creation.component.md): four-step character creation stepper
- [frontend/src/app/components/game-console/game-console.component.md](frontend/src/app/components/game-console/game-console.component.md): main play screen with narrative, combat, log
- [frontend/src/app/components/character-sheet/character-sheet.component.md](frontend/src/app/components/character-sheet/character-sheet.component.md): sidebar stats, HP/XP bars, abilities
- [frontend/src/app/components/inventory/inventory.component.md](frontend/src/app/components/inventory/inventory.component.md): inventory dialog with equip, use, drop

## Frontend: services & models
- [frontend/src/app/services/game-api.service.md](frontend/src/app/services/game-api.service.md): HTTP client, one method per Worker endpoint
- [frontend/src/app/services/character-state.service.md](frontend/src/app/services/character-state.service.md): signal store for character, inventory, combat
- [frontend/src/app/services/auth.service.md](frontend/src/app/services/auth.service.md): local name-only profile and campaign slots
- [frontend/src/app/services/auth.guard.md](frontend/src/app/services/auth.guard.md): route guard that requires a profile
- [frontend/src/app/models/game.models.md](frontend/src/app/models/game.models.md): frontend mirror of Worker types plus UI models
