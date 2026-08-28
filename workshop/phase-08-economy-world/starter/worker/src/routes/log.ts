import { Hono } from 'hono';
import type { Env } from '../types/index.js';

export const logRoutes = new Hono<{ Bindings: Env }>();

// GET /api/log/:sessionId?page=0&limit=20
logRoutes.get('/:sessionId', async (c) => {
  const { sessionId } = c.req.param();

  // TODO: Parse pagination params from the query string:
  //   page  = Math.max(0, parseInt(c.req.query('page')  ?? '0', 10))
  //   limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') ?? '20', 10)))
  //   offset = page * limit

  // TODO: SELECT id, actor, content, created_at FROM adventure_log WHERE session_id = ?
  //   ORDER BY created_at DESC LIMIT ? OFFSET ?. Ordering DESC gets you the newest page
  //   efficiently; reverse the returned array before sending it so the UI can render it
  //   chronologically (oldest → newest) within that page.

  // TODO: Also run SELECT COUNT(*) AS total FROM adventure_log WHERE session_id = ? so
  //   the frontend knows the total entry count (F-27: paginated, reverse-chronological
  //   adventure log).

  // TODO: Respond with { entries, total, page, limit }.

  return c.json({ error: 'log pagination not implemented' }, 501);
});
