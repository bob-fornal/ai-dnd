import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types/index.js';
import { characterRoutes } from './routes/character.js';
import { sessionRoutes }   from './routes/session.js';

const app = new Hono<{ Bindings: Env }>();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use('*', logger());

app.use('*', cors({
  // Hono treats array entries as exact strings — use a function for wildcard subdomains.
  origin: (origin) => {
    if (!origin) return null;
    if (
      origin === 'http://localhost:4200' ||
      origin.endsWith('.pages.dev') ||       // *.pages.dev (any depth)
      origin.endsWith('.workers.dev')        // *.workers.dev (any depth)
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

// More routes are mounted here in later phases:
//   /api/action   → Phase 4 (AI Dungeon Master)
//   /api/combat, /api/levelup → Phase 7 (Combat & Progression)
//   /api/log, /api/shop, /api/quest → Phase 8 (Economy & World)

// ─── 404 fallback ────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ─── Error handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
