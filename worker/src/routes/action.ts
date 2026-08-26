import { Hono } from 'hono';
import type { Env, ActionBody } from '../types/index.js';
import { getCharacter, updateCharacter, shouldLevelUp } from '../services/character.js';
import { loadSession, saveSession, appendHistory, rebuildSession } from '../services/session.js';
import { askDM } from '../services/ai-dm.js';
import { selectMonster, initCombat } from '../services/combat.js';

export const actionRoutes = new Hono<{ Bindings: Env }>();

// POST /api/action — core game loop endpoint
actionRoutes.post('/', async (c) => {
  let body: ActionBody;
  try {
    body = await c.req.json<ActionBody>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { sessionId, characterId, action } = body;

  if (!sessionId || !characterId || !action?.trim()) {
    return c.json({ error: 'sessionId, characterId, and action are required' }, 400);
  }

  // Sanitize player input — strip HTML, limit length
  const sanitizedAction = action
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 500);

  // Load character
  const character = await getCharacter(c.env.DB, characterId);
  if (!character) return c.json({ error: 'Character not found' }, 404);

  // Load session (rebuild from D1 if KV expired)
  let session = await loadSession(c.env.SESSION_KV, sessionId);
  if (!session) {
    session = await rebuildSession(c.env.DB, characterId, sessionId);
  }

  // Guard: must not be in combat (use /combat/resolve for that)
  if (session.inCombat) {
    return c.json({
      error: 'You are in combat! Use /api/combat/resolve to take combat actions.',
      inCombat: true,
    }, 400);
  }

  // Ask the AI DM
  const dmResponse = await askDM(c.env.AI, character, session, sanitizedAction);

  // ── Apply game state changes ─────────────────────────────────────────────
  const changes = dmResponse.gameStateChanges;
  const charUpdates: Parameters<typeof updateCharacter>[2] = {};

  if (changes.hpDelta !== null) {
    const newHp = Math.max(0, Math.min(character.max_hp, character.hp + changes.hpDelta));
    charUpdates.hp = newHp;
  }
  if (changes.xpGained !== null && changes.xpGained > 0) {
    charUpdates.xp = character.xp + changes.xpGained;
  }
  if (changes.goldDelta !== null) {
    charUpdates.gold = Math.max(0, character.gold + changes.goldDelta);
  }
  if (Object.keys(charUpdates).length > 0) {
    await updateCharacter(c.env.DB, characterId, charUpdates);
  }

  // ── Update session ───────────────────────────────────────────────────────
  appendHistory(session, 'player', sanitizedAction);
  appendHistory(session, 'dm', dmResponse.narrative);

  if (changes.locationChange) session.location = changes.locationChange;
  if (changes.questUpdate)    session.activeQuestSummary = changes.questUpdate;

  // ── Handle combat initiation ─────────────────────────────────────────────
  if (changes.combatInitiated && !session.inCombat) {
    const monster = await selectMonster(c.env.DB, character.level);
    session.combatState = initCombat(monster);
    session.inCombat = true;
  }

  await saveSession(c.env.SESSION_KV, sessionId, session);

  // ── Write to adventure log ───────────────────────────────────────────────
  await c.env.DB.batch([
    c.env.DB.prepare(
      'INSERT INTO adventure_log (session_id, character_id, actor, content) VALUES (?,?,?,?)'
    ).bind(sessionId, characterId, 'player', sanitizedAction),
    c.env.DB.prepare(
      'INSERT INTO adventure_log (session_id, character_id, actor, content) VALUES (?,?,?,?)'
    ).bind(sessionId, characterId, 'dm', dmResponse.narrative),
  ]);

  // Refresh character for response
  const updatedCharacter = await getCharacter(c.env.DB, characterId);
  const canLevelUp = updatedCharacter ? shouldLevelUp(updatedCharacter) : false;

  return c.json({
    narrative:        dmResponse.narrative,
    gameStateChanges: changes,
    suggestedActions: dmResponse.suggestedActions,
    diceRolls:        dmResponse.diceRolls,
    updatedCharacter,
    inCombat:         session.inCombat,
    combatState:      session.combatState,
    canLevelUp,
  });
});
