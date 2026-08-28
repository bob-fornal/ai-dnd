# Phase 5 · Frontend Foundations

**Duration:** 25 minutes

---

## Learning Objectives

By the end of this phase you will be able to:

- Explain when to reach for an Angular signal versus an RxJS observable in the same small app, and point to exactly where this app uses each.
- Build a signal-based state service (`CharacterStateService`) with `computed()` derivations that other components can read without ever calling a method.
- Write a thin `HttpClient` wrapper service with one typed method per backend endpoint, matching a documented API spec (PRD.md section 9).
- Describe why this app has no real user accounts (PRD NF-08) and how a localStorage-backed `AuthService` stands in for one.
- Explain why Angular's routing is hash-based (`/#/path`) here, and why that decision matters later at deploy time (Phase 9), not now.

## Prerequisites

- Phase 4 complete: the Worker's `/api/character/create`, `/api/action`, `/api/session/:id`, `/api/log/:sessionId`, and `/api/levelup` endpoints exist and respond (real or `fallbackNarrative()` — either is fine for this phase).
- `frontend/src/app/app.routes.ts` starter is in place with its two `TODO`s (you'll fill them in during this phase).
- The Phase 1 Angular scaffold (`angular.json`, `main.ts`, `app.config.ts`, `environments/`) already exists in your project.

---

## Concepts

### 1. Signals for state, observables for one-shot async

This app draws a clean line: **`CharacterStateService` uses signals** because it's *state* — a current value that many components read reactively and that changes over time (the current character, inventory, combat status). **`GameApiService` returns RxJS `Observable`s** because each method is a *one-shot HTTP call* — you `subscribe()` once, get a response, and you're done. There's no long-lived stream to manage, so RxJS's job here is really just "a promise with cancellation and operators," nothing more.

The two meet at the call site: a component calls `gameApi.sendAction(...).subscribe(res => characterState.setCharacter(res.updatedCharacter))` — the observable's `next` callback is where an HTTP result becomes signal state. Once it's in the signal, every template that reads `characterState.hpPercent()` or `characterState.canLevelUp()` updates automatically, with no manual subscription in the template itself.

### 2. No backend accounts — localStorage only (PRD NF-08)

This is deliberate MVP scope, not a shortcut you'll "fix later." `AuthService.login(username)` never calls the Worker — it just looks for (or creates) a `UserProfile` under a per-username localStorage key. There's no password, no session cookie, no server-side user table. This keeps the whole workshop's auth story to about 90 lines of code so the remaining time goes to the AI DM, combat, and economy — the actual point of the app. `authGuard` (`services/auth.guard.ts`) is the only thing standing between an unauthenticated user and `/characters` or `/game/:sessionId`, and it just checks `authService.isLoggedIn()`.

### 3. Hash-based routing, and why it matters later

`app.routes.ts` is a normal Angular `Routes` array — nothing about it looks hash-specific. The hash requirement (`/#/login` instead of `/login`) comes from how the app is *served*, configured in `app.config.ts`'s router providers, and it exists because Cloudflare Pages (Phase 9) serves static files and has no built-in server-side rewrite for arbitrary deep links the way some other static hosts do. A hash fragment never leaves the browser, so `/#/game/abc123` always resolves to `index.html` regardless of what Cloudflare's edge does with the path. You won't feel this at all today running `ng serve` — it becomes visible only when you deploy in Phase 9, which is exactly why it's called out now: build the habit early.

---

## Step-by-Step

1. Open `starter/frontend/src/app/models/game.models.ts` first — every other file in this phase imports types from it. Using PRD.md section 7 (Data Model) and section 9 (API Specification) as your reference, fill in the missing fields on each interface (the type names are already correct; only the field lists are trimmed).
2. Open `starter/frontend/src/app/services/game-api.service.ts`. Implement each method body as a single `this.http.get/post/patch/delete(...)` call to the endpoint named in its `TODO` comment — the method signatures and return types are already final, so you're only ever writing one line per method (`getInventory` needs the extra `.pipe(map(...))` shown in its TODO).
3. Open `starter/frontend/src/app/services/character-state.service.ts`. Wire the four `set*`/`clear` mutator methods to their signals, then implement the four `computed()` derivations (`hpPercent`, `xpPercent`, `xpToNext`, `modifiers`) and the private `checkLevelUp` helper using `XP_THRESHOLDS` from the models file.
4. Open `starter/frontend/src/app/services/auth.service.ts`. Implement the localStorage read/write helpers (`loadProfile`, `loadProfileByName`, `persist`) first, then the public methods that call them (`login`, `logout`, `addCampaign`, `updateCampaign`, `removeCampaign`, `isLoggedIn`).
5. `services/auth.guard.ts` needs no changes — it's a 12-line supporting file, copy it verbatim if you haven't already.
6. Open `starter/frontend/src/app/components/login/login.component.ts`. The template is complete; implement `login()`, `newCampaign()`, `resumeCampaign()`, `deleteCampaign()`, and `switchUser()` per their `TODO` comments.
7. Open `starter/frontend/src/app/components/character-creation/character-creation.component.ts`. The template and the four-step wizard are complete; implement `createCharacter()` to call `GameApiService.createCharacter()`, save a `CampaignSlot` via `AuthService.addCampaign()`, and navigate to `/game/:sessionId` on success.
8. Finish the two `TODO`s in `app.routes.ts`: a `login` route lazy-loading `LoginComponent`, and a `characters` route lazy-loading `CharacterCreationComponent` guarded by `authGuard`. (Do not add the `game/:sessionId` route yet — `GameConsoleComponent` doesn't exist until Phase 6; the starter's catch-all route redirects to `/login` in the meantime.)
9. Run the Checkpoint below.

If you get stuck on any single piece, the fully-implemented version of every file is in `solution/frontend/src/app/...` — copy just the piece you're stuck on rather than the whole file, so you still get the reps on everything else.

## Code Walkthrough

- **`models/game.models.ts`** — no logic, just the shared vocabulary. `Race`, `CharacterClass`, and `AbilityKey` are simple string-literal unions used for type-safety on form values; every other export is an interface mirroring a D1 row or an API response shape from PRD.md sections 7 and 9.
- **`services/game-api.service.ts`** — one method per row in the PRD.md section 9 table. Note the `API_BASE` constant reads `environment.apiUrl`, which is `http://localhost:8787` in dev and swapped to your deployed Worker URL at build time via Angular's `fileReplacements` — no runtime environment variables needed.
- **`services/character-state.service.ts`** — five private writable signals, exposed as `readonly` via `.asReadonly()` so only this service can mutate them, plus four `computed()` values derived from the character signal. `canLevelUp` is set explicitly by callers (from an API response) rather than always recomputed, because the Worker is the source of truth for "can level up right now," not just raw XP math.
- **`services/auth.service.ts`** — stores a `UserProfile` under two localStorage keys: a stable `ai_dnd_user` (whoever's "currently logged in") and a per-username `ai_dnd_user_{name}` key, so switching users doesn't lose the other user's saved campaigns.
- **`components/login/login.component.ts`** — two view states driven by one signal: no profile yet → username entry; profile loaded → campaign slot list. `resumeCampaign()` and `newCampaign()` are the two ways into `/game/:sessionId` and `/characters` respectively.
- **`components/character-creation/character-creation.component.ts`** — a `mat-stepper` wizard (identity → race → class → review); `createCharacter()` is the one method that talks to the network, and it's the last thing you'll write in this phase.

## Checkpoint

```bash
cd frontend
ng serve
```

1. Navigate to `http://localhost:4200/#/login`. Enter any name and click **Begin Your Legend** — you should land on `/#/characters` (no saved campaigns yet).
2. Step through character creation (name → race → class → review) and click **Enter the World**.
3. Open your browser's Network tab *before* clicking create if you want to see it live: confirm a `POST /api/character/create` request fires and returns 200.
4. You should be navigated to `/#/game/<sessionId>` — and see a blank page or a 404-style redirect back to `/login`. **This is expected.** `GameConsoleComponent` and its route don't exist until Phase 6; you're only confirming that character creation → API call → navigation works end-to-end.
5. Go back to `/#/login` — you should now see your character listed as a campaign slot.

You know this phase is done when: creating a character reliably produces a `sessionId` and character record from the Worker, and `AuthService`'s campaign slot shows up on your next visit to `/login` even after a full page refresh.

## Common Pitfalls

- **Editing `app.routes.ts` beyond its two TODOs.** It's intentionally a stub with exactly two routes to add — the `game/:sessionId` route is provided already-written in Phase 6's `app.routes.ts` files. Don't hand-add it here; you'll just create a merge headache for yourself in Phase 6.
- **Stripped model fields breaking a *different* file.** If you get a template type error in `login.component.ts` about a missing property on `CampaignSlot`, check that you copied every field of `CampaignSlot` from PRD.md section 9/10, not just the ones this phase's TODOs mention.
- **Forgetting `.asReadonly()`.** If you expose the raw writable signal instead of the readonly view from `CharacterStateService`, nothing breaks today — but any other component could mutate character state directly, defeating the point of a single state service.
- **`environment.apiUrl` pointing at the wrong place.** If `ng serve` requests are failing with connection errors, confirm your local Worker is actually running on `:8787` and that `environment.ts` (not `environment.prod.ts`) is the one being used.
- **Treating the Phase 6 "404" as a bug.** Seeing a blank screen or a redirect after character creation is the correct, expected state for this phase — don't spend time debugging it.

## Next

- Previous: [Phase 4 — The AI Dungeon Master](../phase-04-ai-dungeon-master/README.md)
- Next: [Phase 6 — Game Console UI](../phase-06-game-console-ui/README.md)
