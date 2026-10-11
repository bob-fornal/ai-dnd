# Flow: free-text action (main game loop)

A typed action outside combat, from the input box to the AI Dungeon Master and back.

| Step | Where | What happens |
|---|---|---|
| 1 | `game-console.component.html:99-112` → `.ts:113` `sendAction()` | Trims the input, pushes a player entry, calls `GameApiService.sendAction` (`game-api.service.ts:41`). Suggested-action chips (`html:70`) call `sendQuickAction` (`.ts:139`) |
| 2 | `POST /api/action`, `worker/src/routes/action.ts:11` | Strips `<>`, cuts to 500 chars (`:27`); loads the character and session (rebuilds from D1 if KV expired) |
| 3 | `routes/action.ts:43` | 400 if `session.inCombat`; use [combat](combat.md) instead |
| 4 | `routes/action.ts:51` → `services/ai-dm.ts:81` `askDM` | Prompt = character stats + location + quest + last 10 history turns + action + JSON schema. Model `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, falls back to `@cf/mistral/mistral-7b-instruct-v0.2-lora`, then to `fallbackNarrative` |
| 5 | `services/ai-dm.ts` `parseAIResponse` | Strips code fences, extracts the first `{…}`, fills defaults; at most 4 suggestions and 8 dice rolls |
| 6 | `routes/action.ts:57-69` | Applies `hpDelta` (clamped 0..max), positive `xpGained`, `goldDelta` (floor 0). `itemsAdded`/`itemsRemoved` are ignored |
| 7 | `routes/action.ts:72-82` | History, `locationChange`, `questUpdate`; `combatInitiated` starts [combat](combat.md) |
| 8 | `routes/action.ts:85-95` | `saveSession` (7-day TTL, 20 turns) and two `adventure_log` rows |
| 9 | `routes/action.ts:99` | Response includes `canLevelUp` (`shouldLevelUp`) |
| 10 | `game-console.component.ts:121-130` | Pushes the narrative, sets suggestions, updates the character, combat state, and `canLevelUp`, and the campaign slot level |

This is the only path where the AI can change HP, XP, or gold, and the Worker clamps the values.

## Docs
[routes/action.md](../../worker/src/routes/action.md) · [services/ai-dm.md](../../worker/src/services/ai-dm.md) · [services/session.md](../../worker/src/services/session.md) · [game-console](../../frontend/src/app/components/game-console/game-console.component.md) · [game-api.service](../../frontend/src/app/services/game-api.service.md)
