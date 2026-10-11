import { Hono } from 'hono';
import type { Env } from '../types/index.js';
import { loadSession, rebuildSession } from '../services/session.js';
import { getCharacter } from '../services/character.js';

export const sessionRoutes = new Hono<{ Bindings: Env }>();

// GET /api/session/:id
sessionRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();

  const session = await loadSession(c.env.SESSION_KV, id);
  if (!session) {
    return c.json({ error: 'Session not found or expired' }, 404);
  }

  // Also return the character snapshot
  const character = await getCharacter(c.env.DB, session.characterId);

  return c.json({ session, character });
});
