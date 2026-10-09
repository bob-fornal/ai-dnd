import type { KVNamespace } from '@cloudflare/workers-types';
import type { SessionData, HistoryTurn, CombatState } from '../types/index.js';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const MAX_HISTORY = 20;

// ─── Key helpers ─────────────────────────────────────────────────────────────
export const sessionKey = (id: string) => `session:${id}`;

// ─── Load session from KV ─────────────────────────────────────────────────────
export async function loadSession(kv: KVNamespace, sessionId: string): Promise<SessionData | null> {
  const raw = await kv.get(sessionKey(sessionId), 'json');
  return raw as SessionData | null;
}

// ─── Save session to KV ───────────────────────────────────────────────────────
export async function saveSession(
  kv: KVNamespace,
  sessionId: string,
  data: SessionData,
): Promise<void> {
  // Trim history to last MAX_HISTORY turns
  if (data.history.length > MAX_HISTORY) {
    data.history = data.history.slice(-MAX_HISTORY);
  }
  await kv.put(sessionKey(sessionId), JSON.stringify(data), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
}

// ─── Create a fresh session ───────────────────────────────────────────────────
export function newSession(characterId: string): SessionData {
  return {
    characterId,
    location: 'Millhaven — The Rusty Flagon Inn',
    activeQuestId: 4, // "Shadows in the Inn" — level 1 starter
    activeQuestSummary:
      'You have just arrived at the Rusty Flagon Inn. The innkeeper looks nervous, and the other patrons keep glancing over their shoulders. Something is wrong here.',
    inCombat: false,
    combatState: null,
    history: [],
  };
}

// ─── Append a turn to history ─────────────────────────────────────────────────
export function appendHistory(
  session: SessionData,
  role: HistoryTurn['role'],
  content: string,
): void {
  session.history.push({ role, content });
  if (session.history.length > MAX_HISTORY) {
    session.history = session.history.slice(-MAX_HISTORY);
  }
}

// ─── Rebuild session context from D1 log (KV fallback) ───────────────────────
export async function rebuildSession(
  db: import('@cloudflare/workers-types').D1Database,
  characterId: string,
  sessionId: string,
): Promise<SessionData> {
  const { results } = await db.prepare(`
    SELECT actor, content FROM adventure_log
    WHERE session_id = ? AND character_id = ?
    ORDER BY created_at DESC LIMIT 20
  `).bind(sessionId, characterId).all<{ actor: string; content: string }>();

  const history: HistoryTurn[] = results
    .reverse()
    .map(r => ({ role: r.actor as HistoryTurn['role'], content: r.content }));

  return {
    characterId,
    location: 'Unknown — session rebuilt from log',
    activeQuestId: null,
    activeQuestSummary: 'Continue your adventure…',
    inCombat: false,
    combatState: null,
    history,
  };
}
