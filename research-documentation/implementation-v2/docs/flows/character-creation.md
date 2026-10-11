# Flow: character creation

From the login screen to the first narrative in the game console.

| Step | Where | What happens |
|---|---|---|
| 1 | `login.component.ts:42,48` | No campaigns, or **New Campaign**, navigates to `/characters` |
| 2 | `character-creation.component.html:16-125` | Stepper: Identity (name, standard array or 4d6) → Race → Class → Begin |
| 3 | `character-creation.component.ts:67-72` `createCharacter()` | Calls `GameApiService.createCharacter` (`game-api.service.ts:21`) |
| 4 | `POST /api/character/create`, `worker/src/routes/character.ts:11` | Name required, ≤ 40 chars, `< > ' "` stripped (`:29`); new `sessionId` UUID (`:31`) |
| 5 | `services/character.ts:14` `createCharacter` | Scores: `rollAbilityScores` (4d6 drop lowest) or `STANDARD_ARRAY` 15/14/13/12/10/8, plus `RACE_BONUS` (`:28`). HP = class hit die + CON mod (`:41`). AC = class base AC (+DEX mod for Rogues) (`:42`). Gold 50. Starting gear (`:59`, `:65`) |
| 6 | `routes/character.ts:41` | `newSession`: Rusty Flagon Inn, quest 4 "Shadows in the Inn", saved to KV |
| 7 | `routes/character.ts:47-51` | Best-effort AI backstory (usually empty; B-03) plus a fixed opening narrative |
| 8 | `character-creation.component.ts:79-95` | `setCharacter`, `AuthService.addCampaign` (local storage), navigate to `/game/<sessionId>` with `startNarrative` in router state |
| 9 | `game-console.component.ts:74` | Shows `history.state.startNarrative`; then loads the session ([resume-session](resume-session.md)) |

## Class and race values
| Class | Hit die | Base AC | Starting items (item IDs) |
|---|---|---|---|
| Fighter | d10 | 16 | Longsword, Shield, Potion of Healing, Torches (2, 15, 17, 23) |
| Wizard | d6 | 11 | Quarterstaff, Spellbook, Potion of Healing, Torches (5, 26, 17, 23) |
| Rogue | d8 | 13 + DEX mod | Shortsword, Dagger, Thieves Tools, Potion of Healing (1, 3, 25, 17) |
| Cleric | d8 | 14 | Warhammer, Chain Shirt, Potion of Healing, Torches (9, 12, 17, 23) |
| Ranger | d10 | 13 | Shortbow, Leather Armor, Potion of Healing, Rope (6, 11, 17, 22) |
| Bard | d8 | 12 | Rapier, Leather Armor, Potion of Healing, Torches (8, 11, 17, 23) |

Item `23` is Torches, though the code comments say Rations (B-09). Racial bonuses: Human +1 all; Elf +2 DEX +1 INT; Dwarf +2 CON +1 STR; Halfling +2 DEX +1 CHA; Orc +2 STR +1 CON; Tiefling +2 CHA +1 INT.

## Docs
[routes/character.md](../../worker/src/routes/character.md) · [services/character.md](../../worker/src/services/character.md) · [db/seed.md](../../worker/src/db/seed.md) · [types/index.md](../../worker/src/types/index.md) · [character-creation](../../frontend/src/app/components/character-creation/character-creation.component.md) · [login](../../frontend/src/app/components/login/login.component.md)
