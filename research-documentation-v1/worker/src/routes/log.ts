import { Hono } from 'hono';
import type { Env } from '../types/index.js';

export const logRoutes = new Hono<{ Bindings: Env }>();

// GET /api/log/:sessionId?page=0&limit=20
logRoutes.get('/:sessionId', async (c) => {
  const { sessionId } = c.req.param();
  const page  = Math.max(0, parseInt(c.req.query('page')  ?? '0', 10));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') ?? '20', 10)));
  const offset = page * limit;

  const { results } = await c.env.DB.prepare(`
    SELECT id, actor, content, created_at
    FROM adventure_log
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(sessionId, limit, offset).all<{
    id: number;
    actor: string;
    content: string;
    created_at: string;
  }>();

  const countRow = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM adventure_log WHERE session_id = ?'
  ).bind(sessionId).first<{ total: number }>();

  return c.json({
    entries: results.reverse(), // chronological for display
    total: countRow?.total ?? 0,
    page,
    limit,
  });
});
