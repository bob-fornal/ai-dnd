import type { KVNamespace } from '@cloudflare/workers-types';
import type { SessionData, HistoryTurn, CombatState } from '../types/index.js';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const MAX_HISTORY = 20;

// ─── Key helpers ─────────────────────────────────────────────────────────────
export const sessionKey = (id: string) => `session:${id}`;

// ─── Load session from KV ─────────────────────────────────────────────────────
export async function loadSession(kv: KVNamespace, sessionId: string): Promise<SessionData | null> {
  // TODO: kv.get(sessionKey(sessionId), 'json') and return it (or null).
  throw new Error('not implemented');
}

// ─── Save session to KV ───────────────────────────────────────────────────────
export async function saveSession(
  kv: KVNamespace,
  sessionId: string,
  data: SessionData,
): Promise<void> {
  // TODO:
  // 1. If data.history has more than MAX_HISTORY turns, trim it down to the
  //    most recent MAX_HISTORY (data.history.slice(-MAX_HISTORY)).
  // 2. kv.put(sessionKey(sessionId), JSON.stringify(data), { expirationTtl: SESSION_TTL_SECONDS })
  //    — this is what refreshes the 7-day TTL on every write.
  throw new Error('not implemented');
}

// ─── Create a fresh session ───────────────────────────────────────────────────
export function newSession(characterId: string): SessionData {
  // TODO: return a brand-new SessionData for this character — starting
  // location, the level-1 starter quest, not in combat, empty history.
  // See PRD.md section 5 (KV Schema) for the shape.
  throw new Error('not implemented');
}

// ─── Append a turn to history ─────────────────────────────────────────────────
export function appendHistory(
  session: SessionData,
  role: HistoryTurn['role'],
  content: string,
): void {
  // TODO: push { role, content } onto session.history, then trim to the
  // last MAX_HISTORY turns if it has grown past that.
  throw new Error('not implemented');
}

// ─── Rebuild session context from D1 log (KV fallback) ───────────────────────
export async function rebuildSession(
  db: import('@cloudflare/workers-types').D1Database,
  characterId: string,
  sessionId: string,
): Promise<SessionData> {
  // TODO (not needed until later phases — used when a KV session has
  // expired but the D1 adventure_log still has history):
  // pull the last 20 adventure_log rows for this session/character, reverse
  // them into chronological order, and map into HistoryTurn[].
  //
  // SQL hint:
  //   SELECT actor, content FROM adventure_log
  //   WHERE session_id = ? AND character_id = ?
  //   ORDER BY created_at DESC LIMIT 20
  throw new Error('not implemented');
}
