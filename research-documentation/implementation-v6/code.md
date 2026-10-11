# Code Documentation Index

Full index of every doc. Most tasks are faster from the routing table in [AGENTS.md](AGENTS.md). Use this file for areas the table doesn't cover, and the **Symbol index** at the end to look up a symbol, endpoint, or line without searching. Maintenance rules: [docs/AUTHORING.md](docs/AUTHORING.md). To read several docs, line ranges, or symbols in **one** call, use `node tools/read.mjs <targets…>` (see [AGENTS.md](AGENTS.md)).

## Flows (one read per feature)
- [docs/flows/action-loop.md](docs/flows/action-loop.md): free-text action → AI DM → state changes → UI
- [docs/flows/combat.md](docs/flows/combat.md): combat start and one round, with all dice rules
- [docs/flows/character-creation.md](docs/flows/character-creation.md): login → stepper → create → first narrative; class/race values
- [docs/flows/level-up.md](docs/flows/level-up.md): XP thresholds, when offered, endpoint, what changes
- [docs/flows/resume-session.md](docs/flows/resume-session.md): resume path, KV TTL, expiry behavior
- [docs/flows/inventory.md](docs/flows/inventory.md): inventory dialog, equip, potions, shops
- [docs/flows/add-endpoint.md](docs/flows/add-endpoint.md): recipe: files to change for a new endpoint or feature

## Shared documentation
- [docs/PRD.md](docs/PRD.md): product requirements, data model, API spec, prompt design
- [docs/SETUP.md](docs/SETUP.md): local development and deployment steps
- [docs/AUTHORING.md](docs/AUTHORING.md): rules for writing and maintaining these docs
- [docs/DEPLOYMENT_NOTES.md](docs/DEPLOYMENT_NOTES.md): production issues hit while shipping, with fixes
- [../bugs.md](../../bugs.md): known bugs, at the repository root (B-01 to B-14) with location, cause, and affected docs

## Worker: entry & types
- [docs/code/worker/src/index.md](docs/code/worker/src/index.md): Hono app, CORS, health check, mounts all `/api/*` routes
- [docs/code/worker/src/types/index.md](docs/code/worker/src/types/index.md): shared types, bindings, D&D rule constants

## Worker: routes
- [docs/code/worker/src/routes/action.md](docs/code/worker/src/routes/action.md): `POST /api/action`, main loop for free-form actions
- [docs/code/worker/src/routes/character.md](docs/code/worker/src/routes/character.md): create, get, equip, and drop for characters
- [docs/code/worker/src/routes/combat.md](docs/code/worker/src/routes/combat.md): `POST /api/combat/resolve`, one round resolved then narrated
- [docs/code/worker/src/routes/levelup.md](docs/code/worker/src/routes/levelup.md): `POST /api/levelup`, level gain plus ability increase
- [docs/code/worker/src/routes/log.md](docs/code/worker/src/routes/log.md): `GET /api/log/:sessionId`, paginated adventure log
- [docs/code/worker/src/routes/quest.md](docs/code/worker/src/routes/quest.md): AI quest generation and seeded quest list
- [docs/code/worker/src/routes/session.md](docs/code/worker/src/routes/session.md): `GET /api/session/:id`, resume a game
- [docs/code/worker/src/routes/shop.md](docs/code/worker/src/routes/shop.md): shop listing and buy/sell transactions

## Worker: services
- [docs/code/worker/src/services/ai-dm.md](docs/code/worker/src/services/ai-dm.md): all Workers AI calls, prompts, JSON validation
- [docs/code/worker/src/services/character.md](docs/code/worker/src/services/character.md): character creation, update, inventory, leveling rules
- [docs/code/worker/src/services/combat.md](docs/code/worker/src/services/combat.md): monster selection, round resolution, loot
- [docs/code/worker/src/services/dice.md](docs/code/worker/src/services/dice.md): server-side dice engine and modifiers
- [docs/code/worker/src/services/session.md](docs/code/worker/src/services/session.md): KV session load/save, history, D1 rebuild

## Worker: data
- [docs/code/worker/migrations/0001_initial_schema.md](docs/code/worker/migrations/0001_initial_schema.md): D1 tables and columns
- [docs/code/worker/src/db/seed.md](docs/code/worker/src/db/seed.md): reference data and the row IDs the code relies on

## Frontend: app shell
- [docs/code/frontend/src/main.md](docs/code/frontend/src/main.md): bootstrap and the `index.html` host page
- [docs/code/frontend/src/styles.md](docs/code/frontend/src/styles.md): global M3 theme, CSS variables, utility classes
- [docs/code/frontend/src/environments/environment.md](docs/code/frontend/src/environments/environment.md): build-time API URL and Pages config
- [docs/code/frontend/src/app/app.component.md](docs/code/frontend/src/app/app.component.md): root shell with router outlet
- [docs/code/frontend/src/app/app.config.md](docs/code/frontend/src/app/app.config.md): providers, hash routing, HttpClient
- [docs/code/frontend/src/app/app.routes.md](docs/code/frontend/src/app/app.routes.md): lazy routes and guards

## Frontend: components
- [docs/code/frontend/src/app/components/login/login.component.md](docs/code/frontend/src/app/components/login/login.component.md): name entry and campaign slot picker
- [docs/code/frontend/src/app/components/character-creation/character-creation.component.md](docs/code/frontend/src/app/components/character-creation/character-creation.component.md): four-step character creation stepper
- [docs/code/frontend/src/app/components/game-console/game-console.component.md](docs/code/frontend/src/app/components/game-console/game-console.component.md): main play screen with narrative, combat, log
- [docs/code/frontend/src/app/components/character-sheet/character-sheet.component.md](docs/code/frontend/src/app/components/character-sheet/character-sheet.component.md): sidebar stats, HP/XP bars, abilities
- [docs/code/frontend/src/app/components/inventory/inventory.component.md](docs/code/frontend/src/app/components/inventory/inventory.component.md): inventory dialog with equip, use, drop

## Frontend: services & models
- [docs/code/frontend/src/app/services/game-api.service.md](docs/code/frontend/src/app/services/game-api.service.md): HTTP client, one method per Worker endpoint
- [docs/code/frontend/src/app/services/character-state.service.md](docs/code/frontend/src/app/services/character-state.service.md): signal store for character, inventory, combat
- [docs/code/frontend/src/app/services/auth.service.md](docs/code/frontend/src/app/services/auth.service.md): local name-only profile and campaign slots
- [docs/code/frontend/src/app/services/auth.guard.md](docs/code/frontend/src/app/services/auth.guard.md): route guard that requires a profile
- [docs/code/frontend/src/app/models/game.models.md](docs/code/frontend/src/app/models/game.models.md): frontend mirror of Worker types plus UI models

<!-- symbol-index:start -->
## Symbol index

Generated by `research-documentation/work/scripts/build-symbol-index.mjs`; don't edit by hand. Format: `symbol:line`. Use it instead of searching: open the doc, or view the code at that line range.

### Endpoints

| Method | Path | Code | Doc |
|---|---|---|---|
| POST | `/api/action` | `worker/src/routes/action.ts:11` | [doc](docs/code/worker/src/routes/action.md) |
| POST | `/api/character/create` | `worker/src/routes/character.ts:11` | [doc](docs/code/worker/src/routes/character.md) |
| GET | `/api/character/:id` | `worker/src/routes/character.ts:72` | [doc](docs/code/worker/src/routes/character.md) |
| PATCH | `/api/character/:id/equip` | `worker/src/routes/character.ts:93` | [doc](docs/code/worker/src/routes/character.md) |
| DELETE | `/api/character/:id/inventory/:itemId` | `worker/src/routes/character.ts:137` | [doc](docs/code/worker/src/routes/character.md) |
| POST | `/api/combat/resolve` | `worker/src/routes/combat.ts:11` | [doc](docs/code/worker/src/routes/combat.md) |
| POST | `/api/levelup` | `worker/src/routes/levelup.ts:10` | [doc](docs/code/worker/src/routes/levelup.md) |
| GET | `/api/log/:sessionId` | `worker/src/routes/log.ts:7` | [doc](docs/code/worker/src/routes/log.md) |
| POST | `/api/quest/generate` | `worker/src/routes/quest.ts:10` | [doc](docs/code/worker/src/routes/quest.md) |
| GET | `/api/quest/list` | `worker/src/routes/quest.ts:32` | [doc](docs/code/worker/src/routes/quest.md) |
| GET | `/api/session/:id` | `worker/src/routes/session.ts:9` | [doc](docs/code/worker/src/routes/session.md) |
| GET | `/api/shop/:id` | `worker/src/routes/shop.ts:8` | [doc](docs/code/worker/src/routes/shop.md) |
| POST | `/api/shop/transaction` | `worker/src/routes/shop.ts:27` | [doc](docs/code/worker/src/routes/shop.md) |

### Symbols by file

- `frontend/src/app/app.component.ts` ([doc](docs/code/frontend/src/app/app.component.md)): `AppComponent:11`
- `frontend/src/app/app.config.ts` ([doc](docs/code/frontend/src/app/app.config.md)): `appConfig:8`
- `frontend/src/app/app.routes.ts` ([doc](docs/code/frontend/src/app/app.routes.md)): `routes:4`
- `frontend/src/app/components/character-creation/character-creation.component.ts` ([doc](docs/code/frontend/src/app/components/character-creation/character-creation.component.md)): `CharacterCreationComponent:34`, `createCharacter():67`
- `frontend/src/app/components/character-sheet/character-sheet.component.ts` ([doc](docs/code/frontend/src/app/components/character-sheet/character-sheet.component.md)): `CharacterSheetComponent:17`
- `frontend/src/app/components/game-console/game-console.component.ts` ([doc](docs/code/frontend/src/app/components/game-console/game-console.component.md)): `GameConsoleComponent:42`, `ngOnInit():69`, `ngAfterViewChecked():106`, `sendAction():113`, `sendQuickAction():139`, `combatAction():144`, `levelUp():183`, `loadMoreLog():199`, `enemyHpPercent():213`, `openInventory():237`
- `frontend/src/app/components/inventory/inventory.component.ts` ([doc](docs/code/frontend/src/app/components/inventory/inventory.component.md)): `InventoryDialogData:19`, `InventoryComponent:36`, `ngOnInit():53`, `toggleEquip():72`, `usePotion():96`, `dropItem():144`, `typeIcon():164`, `close():174`
- `frontend/src/app/components/login/login.component.ts` ([doc](docs/code/frontend/src/app/components/login/login.component.md)): `LoginComponent:25`, `login():33`, `newCampaign():47`, `resumeCampaign():51`, `deleteCampaign():55`, `switchUser():60`
- `frontend/src/app/models/game.models.ts` ([doc](docs/code/frontend/src/app/models/game.models.md)): `Race:4`, `CharacterClass:5`, `AbilityKey:6`, `Character:8`, `ItemEffect:30`, `Item:39`, `InventoryEntry:48`, `Monster:57`, `CombatState:69`, `DiceRoll:77`, `GameStateChanges:83`, `ActionResponse:95`, `CombatResponse:106`, `LogEntry:121`, `UserProfile:128`, `CampaignSlot:133`, `XP_THRESHOLDS:146`, `ABILITY_LABELS:148`
- `frontend/src/app/services/auth.guard.ts` ([doc](docs/code/frontend/src/app/services/auth.guard.md)): `authGuard:5`
- `frontend/src/app/services/auth.service.ts` ([doc](docs/code/frontend/src/app/services/auth.service.md)): `AuthService:7`, `isLoggedIn():12`, `login():16`, `logout():31`, `addCampaign():36`, `updateCampaign():44`, `removeCampaign():54`
- `frontend/src/app/services/character-state.service.ts` ([doc](docs/code/frontend/src/app/services/character-state.service.md)): `CharacterStateService:6`, `setCharacter():50`, `setInventory():55`, `setCombatState():59`, `setCanLevelUp():64`, `clear():68`
- `frontend/src/app/services/game-api.service.ts` ([doc](docs/code/frontend/src/app/services/game-api.service.md)): `GameApiService:17`, `createCharacter():21`, `getCharacter():36`, `sendAction():41`, `resolveCombat():50`, `getSession():62`, `getLog():67`, `levelUp():74`, `generateQuest():85`, `getInventory():90`, `equipItem():96`, `dropItem():100`, `getShop():105`, `shopTransaction():109`
- `frontend/src/environments/environment.prod.ts` ([doc](docs/code/frontend/src/environments/environment.md)): `environment:1`
- `frontend/src/environments/environment.ts` ([doc](docs/code/frontend/src/environments/environment.md)): `environment:1`
- `worker/src/routes/action.ts` ([doc](docs/code/worker/src/routes/action.md)): `actionRoutes:8`
- `worker/src/routes/character.ts` ([doc](docs/code/worker/src/routes/character.md)): `characterRoutes:8`
- `worker/src/routes/combat.ts` ([doc](docs/code/worker/src/routes/combat.md)): `combatRoutes:8`
- `worker/src/routes/levelup.ts` ([doc](docs/code/worker/src/routes/levelup.md)): `levelUpRoutes:7`
- `worker/src/routes/log.ts` ([doc](docs/code/worker/src/routes/log.md)): `logRoutes:4`
- `worker/src/routes/quest.ts` ([doc](docs/code/worker/src/routes/quest.md)): `questRoutes:7`
- `worker/src/routes/session.ts` ([doc](docs/code/worker/src/routes/session.md)): `sessionRoutes:6`
- `worker/src/routes/shop.ts` ([doc](docs/code/worker/src/routes/shop.md)): `shopRoutes:5`
- `worker/src/services/ai-dm.ts` ([doc](docs/code/worker/src/services/ai-dm.md)): `askDM:81`, `GeneratedQuest:213`, `generateQuest:222`, `generateBackstory:276`, `generateLevelUpNarrative:304`
- `worker/src/services/character.ts` ([doc](docs/code/worker/src/services/character.md)): `createCharacter:14`, `getCharacter:86`, `updateCharacter:94`, `getInventory:107`, `levelUp:133`, `shouldLevelUp:159`
- `worker/src/services/combat.ts` ([doc](docs/code/worker/src/services/combat.md)): `selectMonster:6`, `initCombat:27`, `CombatRoundResult:38`, `resolveCombatRound:50`, `rollLoot:182`, `grantLoot:205`
- `worker/src/services/dice.ts` ([doc](docs/code/worker/src/services/dice.md)): `roll:7`, `rollExpression:15`, `roll4d6DropLowest:31`, `rollAbilityScores:38`, `modifier:50`, `attackRoll:55`
- `worker/src/services/session.ts` ([doc](docs/code/worker/src/services/session.md)): `sessionKey:8`, `loadSession:11`, `saveSession:17`, `newSession:32`, `appendHistory:46`, `rebuildSession:58`
- `worker/src/types/index.ts` ([doc](docs/code/worker/src/types/index.md)): `Env:2`, `Race:10`, `CharacterClass:11`, `AbilityScores:13`, `Character:22`, `ItemType:45`, `ItemEffect:47`, `Item:55`, `InventoryEntry:64`, `Monster:74`, `DiceRoll:88`, `CombatState:94`, `HistoryTurn:103`, `SessionData:108`, `GameStateChanges:119`, `AIDMResponse:131`, `CreateCharacterBody:139`, `ActionBody:146`, `CombatActionBody:152`, `ShopTransactionBody:159`, `LevelUpBody:168`, `XP_THRESHOLDS:175`, `STANDARD_ARRAY:179`, `CLASS_HIT_DICE:183`, `CLASS_STARTING_AC:192`, `RACE_BONUS:201`
<!-- symbol-index:end -->
