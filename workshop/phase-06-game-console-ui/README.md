# Phase 6 · Game Console UI

**Duration:** 20 minutes

---

## Learning Objectives

By the end of this phase you will be able to:

- Build a reactive main-screen component whose template drives itself off signals from a shared state service, with almost no local UI state of its own.
- Wire player actions and combat moves to `GameApiService`, and fan the response back out into `CharacterStateService` so every other component (sidebar, header) updates for free.
- Explain the deliberate "frontend-first UI shell" workshop sequencing: why it's fine — even good — to build and demo combat/inventory UI before their backends are more than a shape (Phases 7–8 catch up later).
- Build out a full Angular Material dark-fantasy theme from a minimal placeholder: a custom `mat.define-theme()`, Google Fonts, and CSS custom properties consumed by name from component templates.

## Prerequisites

- Phase 5 complete: `CharacterStateService`, `GameApiService`, `AuthService`, and character creation all working, ending on a (currently blank/404) `/#/game/:sessionId` route.
- Phase 4's `/api/action`, `/api/combat/resolve` (stub is fine — Phase 7 builds it out), `/api/log/:sessionId`, and `/api/levelup` endpoints exist and respond.

---

## Concepts

### 1. The state service is doing the reactive work — the console just reads it

Almost every conditional and binding in `game-console.component.ts`'s template reads directly from `charSvc` (`charSvc.inCombat()`, `charSvc.combatState()`, `charSvc.canLevelUp()`, `charSvc.inventory().length`) — the `CharacterStateService` you built in Phase 5. The component's *own* signals (`entries`, `suggestedActions`, `loading`, `logEntries`) are console-local UI state — the narrative scrollback and the log panel don't belong on the shared character state, because nothing else in the app needs to read them. Notice what this buys you: when `combatAction()` calls `charSvc.setCombatState(...)`, the combat header, the level-up panel, and the character sheet sidebar all update in the same tick, with zero wiring between those three pieces — they're not talking to each other, they're all just reading the same signal.

### 2. Frontend-first UI shell — a deliberate teaching choice, not a workaround

By the end of this phase, clicking **Inventory** opens a fully working dialog, and the combat action buttons (Attack/Dodge/Use Item/Flee) render correctly the instant `charSvc.inCombat()` flips true — even though `/api/combat/resolve`'s real resolution logic doesn't land until Phase 7, and the shop/economy backend isn't built until Phase 8. This is intentional: building the UI against a known response *shape* first, then filling in the backend behind it, means you get to see and demo the interaction (a red combat border, HP bars ticking down, a level-up panel lighting up) well before the mechanics behind it are done. It also means Phase 7 and 8 are pure backend work with an already-working UI to validate against, instead of building backend and frontend for the same feature in the same sitting.

### 3. `InventoryComponent` is provided complete here

`inventory.component.ts` is copied in **verbatim, unstubbed**, in both `starter/` and `solution/` for this phase — so the console compiles and the **Inventory** button works end-to-end today. Its buy/sell/equip/use-potion logic is real, working code; you're not asked to write or understand its internals in this phase. We dig into building that logic ourselves in **Phase 8** (Economy & World), where you'll effectively rebuild what's already sitting in front of you here — treat this phase's copy as "so you can see it work," not "study this now."

### 4. Building out the theme (PRD.md section 10)

Phase 1 left `styles.scss` as a bare Material-core-plus-reset placeholder. This phase is where it becomes the actual dark-fantasy look: a custom `mat.define-theme()` (dark, violet primary, amber tertiary), Google Fonts (Cinzel for titles/UI chrome, Crimson Text for narrative prose), and a set of CSS custom properties (`--bg-deep`, `--gold`, `--purple-light`, `--narrative-font`, etc.) that every component in this phase already references by name in its `styles: [...]` block. That's why the components render but look unstyled/default-Material until you finish the `styles.scss` TODOs — the class names and variables are already wired up, waiting for definitions.

---

## Step-by-Step

1. Open `starter/frontend/src/app/components/game-console/game-console.component.ts`. The template, styles, field declarations, and constructor injections are complete — read through `ngOnInit` and each method's `TODO` comment before writing anything, since several methods call each other (`sendQuickAction` → `sendAction`, `combatAction`/`levelUp` → `updateCampaignSlot`).
2. Implement `ngOnInit()`: read the `sessionId` route param (already done for you), check `history.state` for a start narrative from character creation, call `GameApiService.getSession()`, then `getInventory()`, then `loadLog()`.
3. Implement the private helpers first — `pushEntry()`, `scrollBottom()`, `loadLog()` — since `sendAction()`, `combatAction()`, and `levelUp()` all call `pushEntry()`.
4. Implement `ngAfterViewChecked()` (the scroll-to-bottom trigger), then `sendAction()`, `sendQuickAction()`, `combatAction()`, `levelUp()`, `loadMoreLog()`, and `enemyHpPercent()`.
5. Implement `openInventory()` — open `InventoryComponent` (imported already) via `MatDialog`, passing an `InventoryDialogData`.
6. Implement `updateCampaignSlot()` using `AuthService`, same pattern as Phase 5's character creation.
7. Open `starter/frontend/src/app/components/character-sheet/character-sheet.component.ts` — read it over, but there's nothing to implement here. It's a pure display component: every computed value it needs (`hpPercent`, `xpPercent`, `xpToNext`, `modifiers`) already lives on `CharacterStateService` from Phase 5, so this file is template-only.
8. Confirm `starter/frontend/src/app/components/inventory/inventory.component.ts` is present (copied verbatim, no changes needed).
9. Open `starter/frontend/src/styles.scss` and work through its numbered `TODO`s — Google Fonts import, `mat.define-theme()`, CSS custom properties, global look, the `.narrative-block` parchment panel, `.hp-bar`/`.hp-fill` states, `.in-combat-border`, and Material component overrides.
10. Confirm `app.routes.ts` already has the `game/:sessionId` route (provided complete this phase — don't edit it).
11. Run the Checkpoint below.

If you get stuck, `solution/frontend/src/app/components/game-console/game-console.component.ts` and `solution/frontend/src/styles.scss` have the fully-implemented versions — copy just the method or theme section you're stuck on.

## Code Walkthrough

- **`game-console.component.ts`** — three regions: a left sidebar (`CharacterSheetComponent` + inventory button + level-up panel), the main console (combat header, narrative scroll, quick-action chips or combat buttons, input row), and a right sidebar (paginated adventure log). `charSvc.inCombat()` toggles between the free-text input row and the four combat action buttons — the player is never shown both at once.
- **`character-sheet.component.ts`** — straightforward template-driven display: HP bar with three color states, AC/XP/Gold quick-stats, an XP progress bar, and a 3x2 ability score grid with modifiers. Every dynamic value comes from `CharacterStateService`'s computed signals; there's no logic to write here, which is worth noticing as a contrast to the console component.
- **`inventory.component.ts`** (supporting, not stubbed) — tabbed dialog (All/Weapons/Armor/Consumables) with equip/unequip, use-potion (client-side heal-amount roll), and drop actions, each calling `GameApiService` and syncing the result back into `CharacterStateService`.
- **`styles.scss`** — the dark theme lives entirely here: no component in this phase defines its own color palette, they all reference the custom properties this file defines.

## Checkpoint

```bash
cd frontend
ng serve
```

1. From `/#/login`, create a character (or resume one from Phase 5's testing).
2. You should land on `/#/game/:sessionId` and see the game console: character sheet sidebar on the left, narrative area in the center, adventure log on the right.
3. Type an action (or click a suggested-action chip) and confirm a narrative response appears. **Note:** if Phase 4's AI integration is still using its starter stubs, you'll see `fallbackNarrative()`'s generic text instead of a real AI response — that's expected here; finishing Phase 4 properly is what makes this feel like a real, reactive story.
4. Confirm the character sheet's HP/XP/Gold update after an action that changes them.
5. Click **Inventory** — confirm the (fully working, provided) dialog opens, shows tabs, and equip/drop actions work.

You know this phase is done when: the full loop — create character → land on console → send an action → see narrative + stat updates → open inventory — works without a page reload, and the app visually matches PRD.md section 10's dark-fantasy description instead of looking like default Angular Material.

## Common Pitfalls

- **Styling nothing renders "themed."** If the console looks like plain Material even after finishing the component TODOs, it's `styles.scss` that's incomplete, not the components — they were built to consume CSS variables and classes that only exist once you finish that file's TODOs.
- **Forgetting `charSvc.setInventory()` after `getInventory()` in `ngOnInit`.** Without it, the inventory button's `(count)` badge stays at 0 even though the dialog itself loads correctly (it calls `getInventory()` again on open).
- **Calling `combatAction()` without checking `loading()` first.** Rapid double-clicks on Attack before the first request resolves can fire two combat turns; guard it the same way `sendAction()` does.
- **Trying to "fix" the fallback narrative text.** If Phase 4 wasn't fully completed, `fallbackNarrative()`'s generic prose is the correct, working behavior for this phase — nothing to debug here.
- **Editing `app.routes.ts`.** It's provided complete in both `starter/` and `solution/` for this phase; there's nothing left to add.

## Next

- Previous: [Phase 5 — Frontend Foundations](../phase-05-frontend-foundations/README.md)
- Next: [Phase 7 — Combat & Progression](../phase-07-combat-progression/README.md)
