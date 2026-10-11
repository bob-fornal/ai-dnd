import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types/index.js';
import { characterRoutes } from './routes/character.js';
import { actionRoutes }    from './routes/action.js';
import { combatRoutes }    from './routes/combat.js';
import { sessionRoutes }   from './routes/session.js';
import { logRoutes }       from './routes/log.js';
import { shopRoutes }      from './routes/shop.js';
import { levelUpRoutes }   from './routes/levelup.js';
import { questRoutes }     from './routes/quest.js';

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
app.route('/api/action',    actionRoutes);
app.route('/api/combat',    combatRoutes);
app.route('/api/session',   sessionRoutes);
app.route('/api/log',       logRoutes);
app.route('/api/shop',      shopRoutes);
app.route('/api/levelup',   levelUpRoutes);
app.route('/api/quest',     questRoutes);

// ─── 404 fallback ────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ─── Error handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
