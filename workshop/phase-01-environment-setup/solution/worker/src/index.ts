import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Minimal binding shape for this phase. The full `Env` type — with the AI,
// D1 (DB), and KV (SESSION_KV) bindings — is introduced in Phase 2's
// worker/src/types/index.ts and wired into wrangler.toml from Phase 3 on,
// once there's actually a database/session to talk to.
type Env = {
  ENVIRONMENT?: string;
};

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
// The real feature routes (character, action, combat, session, log, shop,
// levelup, quest) get mounted here starting in Phase 3. For now this Worker
// only exposes the health check above.

// ─── 404 fallback ────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ─── Error handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
