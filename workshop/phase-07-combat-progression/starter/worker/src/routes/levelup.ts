import { Hono } from 'hono';
import type { Env, LevelUpBody, AbilityScores } from '../types/index.js';
import { getCharacter, levelUp, shouldLevelUp } from '../services/character.js';
import { loadSession, saveSession, rebuildSession } from '../services/session.js';
import { generateLevelUpNarrative } from '../services/ai-dm.js';

export const levelUpRoutes = new Hono<{ Bindings: Env }>();

// POST /api/levelup
levelUpRoutes.post('/', async (c) => {
  let body: LevelUpBody;
  try {
    body = await c.req.json<LevelUpBody>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { sessionId, characterId, abilityChoice } = body;
  if (!sessionId || !characterId || !abilityChoice) {
    return c.json({ error: 'sessionId, characterId, and abilityChoice are required' }, 400);
  }

  const validAbilities: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  if (!validAbilities.includes(abilityChoice)) {
    return c.json({ error: `abilityChoice must be one of: ${validAbilities.join(', ')}` }, 400);
  }

  const character = await getCharacter(c.env.DB, characterId);
  if (!character) return c.json({ error: 'Character not found' }, 404);

  // TODO 1 — Guard against leveling up without enough XP: return a 400 unless
  //   shouldLevelUp(character) is true. XP thresholds follow the D&D 5e table
  //   (XP_THRESHOLDS in ../types/index.js) — see PRD 4.7 / F-28: Level 2 = 300 XP,
  //   Level 3 = 900 XP, … Level 10 = 64,000 XP. Max level is 10 (F-30).

  // TODO 2 — Perform the level-up:
  //     const updatedCharacter = await levelUp(c.env.DB, character, abilityChoice);
  //   That service function (from an earlier phase) increases HP by the class hit die,
  //   applies the chosen ability score improvement, bumps `level`, and persists the row.

  // TODO 3 — Generate a level-up narrative — this is the AI DM again, same pattern as
  //   Phase 4 and the combat route, just a different prompt (F-29):
  //     const narrative = await generateLevelUpNarrative(c.env.AI, character,
  //       updatedCharacter.level);

  // TODO 4 — Log the event to D1 `adventure_log` (actor 'system'), then load the session
  //   (loadSession / rebuildSession), push { role: 'dm', content: narrative } onto
  //   session.history, and saveSession(c.env.SESSION_KV, sessionId, session).

  // TODO 5 — Return { narrative, updatedCharacter, abilityImproved: abilityChoice,
  //   newLevel: updatedCharacter.level } per PRD 9 (`POST /api/levelup`).

  return c.json({ error: 'levelup not implemented' }, 501);
});
