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

  if (!shouldLevelUp(character)) {
    return c.json({ error: 'Character does not have enough XP to level up' }, 400);
  }

  // Perform level-up
  const updatedCharacter = await levelUp(c.env.DB, character, abilityChoice);

  // Generate narrative
  const narrative = await generateLevelUpNarrative(c.env.AI, character, updatedCharacter.level);

  // Log it
  await c.env.DB.prepare(
    'INSERT INTO adventure_log (session_id, character_id, actor, content) VALUES (?,?,?,?)'
  ).bind(sessionId, characterId, 'system', `[Level Up] ${character.name} reached Level ${updatedCharacter.level}! ${narrative}`).run();

  // Update session history
  let session = await loadSession(c.env.SESSION_KV, sessionId);
  if (!session) session = await rebuildSession(c.env.DB, characterId, sessionId);
  session.history.push({ role: 'dm', content: narrative });
  await saveSession(c.env.SESSION_KV, sessionId, session);

  return c.json({
    narrative,
    updatedCharacter,
    abilityImproved: abilityChoice,
    newLevel: updatedCharacter.level,
  });
});
