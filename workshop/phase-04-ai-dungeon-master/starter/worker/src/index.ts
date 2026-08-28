import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types/index.js';
import { characterRoutes } from './routes/character.js';
import { sessionRoutes }   from './routes/session.js';
// TODO: import actionRoutes from './routes/action.js'

const app = new Hono<{ Bindings: Env }>();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use('*', logger());

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return null;
    if (
      origin === 'http://localhost:4200' ||
      origin.endsWith('.pages.dev') ||
      origin.endsWith('.workers.dev')
    ) {
      return origin;
    }
    return null;
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.route('/api/character', characterRoutes);
app.route('/api/session',   sessionRoutes);
// TODO: mount actionRoutes at /api/action — this is the endpoint the AI Dungeon
// Master lives behind, built in this phase.

// ─── 404 fallback ────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ─── Error handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
