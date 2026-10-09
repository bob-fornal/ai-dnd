# routes/levelup.ts

`POST /api/levelup` applies one level-up once the character has enough XP.

## Request / response
- **Body:** `{ sessionId, characterId, abilityChoice: 'str'|'dex'|'con'|'int'|'wis'|'cha' }`
- **Response:** `{ narrative, updatedCharacter, abilityImproved, newLevel }`
- **Errors:** 400 for bad input, an invalid ability, or not enough XP; 404 if the character doesn't exist.

## Flow
1. Validate the ability and check `shouldLevelUp`.
2. `levelUp`: +1 level, roll HP, +2 to the chosen ability.
3. Generate flavor text and log it as a `system` entry (`[Level Up] …`).
4. Add the narrative to session history as a DM turn and save.

## Gotchas
- One level per call. A character with enough XP for several levels has to call repeatedly.
- The narrative is almost always the fallback text ([services/ai-dm.md](../services/ai-dm.md)).

## Connections
**Parents (used by):**
- [../index.md](../index.md): mounted at `/api/levelup`
- Called over HTTP by [game-api.service.md](../../../frontend/src/app/services/game-api.service.md) (`levelUp`)

**Children (uses):**
- [services/character.md](../services/character.md): `getCharacter`, `levelUp`, `shouldLevelUp`
- [services/session.md](../services/session.md): `loadSession`, `saveSession`, `rebuildSession`
- [services/ai-dm.md](../services/ai-dm.md): `generateLevelUpNarrative`
- [types/index.md](../types/index.md): `Env`, `LevelUpBody`, `AbilityScores`
