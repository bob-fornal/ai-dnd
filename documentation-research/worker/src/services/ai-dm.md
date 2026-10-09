# services/ai-dm.ts

Every Workers AI call: the Dungeon Master turn, quest generation, backstory, and level-up flavor text. **The AI narrates; it never decides mechanical outcomes.**

## Key exports
| Name | Purpose |
|---|---|
| `askDM(ai, char, session, action, combatContext?)` | Main DM turn. Returns a validated `AIDMResponse` |
| `generateQuest(ai, char, location)` | Returns `GeneratedQuest` (title, description, location, hook, rewards) |
| `generateBackstory(ai, name, race, cls)` | Two-sentence backstory |
| `generateLevelUpNarrative(ai, char, level)` | One or two sentences of prose |

## How `askDM` works
1. `buildUserPrompt` adds the character stats, location, quest summary, the last 10 history turns, any pre-resolved combat context, the player action, and `RESPONSE_SCHEMA`.
2. Calls `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (`json_object` format, temperature 0.85, 1024 tokens).
3. If that throws, it retries with `@cf/mistral/mistral-7b-instruct-v0.2-lora`. If both fail, it returns `fallbackNarrative`.
4. `parseAIResponse` strips code fences, pulls out the first `{…}` block, and fills defaults for every field.

## Rules
- `SYSTEM_PROMPT` sets a dark, mature tone. It tells the model never to break character, to return JSON only, and **not** to report attack or damage rolls.
- Text is pulled from both `choices[0].message.content` (OpenAI-style) and the legacy `response` field ([DEPLOYMENT_NOTES §6](../../../docs/DEPLOYMENT_NOTES.md#6-workers-ai--model-deprecation)).
- At most 4 `suggestedActions` and 8 `diceRolls` are kept.
- Keep `RESPONSE_SCHEMA` in step with `AIDMResponse` in [types/index.md](../types/index.md).

## Gotchas
- `generateQuest`, `generateBackstory`, and `generateLevelUpNarrative` only read the legacy `response` field. With llama-3.3 they fall back to canned text or an empty string ([bugs.md B-03](../../../bugs.md)).
- `wrangler dev` without `--remote` stubs AI, so you'll always get the fallback text locally.

## Connections
**Parents (used by):**
- [routes/action.md](../routes/action.md), [routes/combat.md](../routes/combat.md): `askDM`
- [routes/character.md](../routes/character.md): `generateBackstory`
- [routes/levelup.md](../routes/levelup.md): `generateLevelUpNarrative`
- [routes/quest.md](../routes/quest.md): `generateQuest`

**Children (uses):**
- [types/index.md](../types/index.md): `Character`, `SessionData`, `AIDMResponse`, `DiceRoll`
- Spec: [PRD §4.2](../../../PRD.md#42-ai-dungeon-master-core-feature), [PRD §8](../../../PRD.md#8-ai-prompt-engineering)
