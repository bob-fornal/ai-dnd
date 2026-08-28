import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types/index.js';
// TODO: import characterRoutes from './routes/character.js'
// TODO: import sessionRoutes from './routes/session.js'

const app = new Hono<{ Bindings: Env }>();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use('*', logger());

app.use('*', cors({
  // Hono treats array entries as exact strings — a wildcard subdomain like
  // 'https://*.workers.dev' will NEVER match. Use a function instead.
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
// TODO: add a GET /api/health route that returns { status: 'ok', timestamp }

// ─── Routes ──────────────────────────────────────────────────────────────────
// TODO: mount characterRoutes at /api/character
// TODO: mount sessionRoutes at /api/session

// ─── 404 fallback ────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ─── Error handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
