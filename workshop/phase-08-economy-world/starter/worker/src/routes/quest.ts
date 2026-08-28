import { Hono } from 'hono';
import type { Env } from '../types/index.js';
import { getCharacter } from '../services/character.js';
import { loadSession, saveSession, rebuildSession } from '../services/session.js';
import { generateQuest } from '../services/ai-dm.js';

export const questRoutes = new Hono<{ Bindings: Env }>();

// POST /api/quest/generate — dynamically generate a new quest
questRoutes.post('/generate', async (c) => {
  const { sessionId, characterId } = await c.req.json<{ sessionId: string; characterId: string }>();
  if (!sessionId || !characterId) {
    return c.json({ error: 'sessionId and characterId required' }, 400);
  }

  const character = await getCharacter(c.env.DB, characterId);
  if (!character) return c.json({ error: 'Character not found' }, 404);

  let session = await loadSession(c.env.SESSION_KV, sessionId);
  if (!session) session = await rebuildSession(c.env.DB, characterId, sessionId);

  // TODO: Ask the AI DM to flesh out a quest for the character's current location:
  //     const quest = await generateQuest(c.env.AI, character, session.location);
  // TODO: Stash quest.description on session.activeQuestSummary and persist with
  //   saveSession(c.env.SESSION_KV, sessionId, session).
  // TODO: Respond with { quest }.

  return c.json({ error: 'quest generation not implemented' }, 501);
});

// GET /api/quest/list — get seeded quests by level
questRoutes.get('/list', async (c) => {
  const level = parseInt(c.req.query('level') ?? '1', 10);

  // TODO: SELECT * FROM quests WHERE level_min <= ? AND level_max >= ? ORDER BY
  //   level_min ASC, binding `level` twice. This is the same D1 read pattern from
  //   Phase 2 — just filtering the seeded `quests` table by the player's level.
  const quests: unknown[] = [];

  return c.json({ quests });
});
