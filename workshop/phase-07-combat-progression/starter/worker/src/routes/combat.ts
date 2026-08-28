import { Hono } from 'hono';
import type { Env, CombatActionBody } from '../types/index.js';
import { getCharacter, updateCharacter, shouldLevelUp } from '../services/character.js';
import { loadSession, saveSession, appendHistory, rebuildSession } from '../services/session.js';
import { resolveCombatRound, rollLoot, grantLoot } from '../services/combat.js';
import { askDM } from '../services/ai-dm.js';

export const combatRoutes = new Hono<{ Bindings: Env }>();

// POST /api/combat/resolve
combatRoutes.post('/resolve', async (c) => {
  let body: CombatActionBody;
  try {
    body = await c.req.json<CombatActionBody>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { sessionId, characterId, action } = body;
  if (!sessionId || !characterId || !action) {
    return c.json({ error: 'sessionId, characterId, and action are required' }, 400);
  }

  // Load character + session
  const character = await getCharacter(c.env.DB, characterId);
  if (!character) return c.json({ error: 'Character not found' }, 404);

  let session = await loadSession(c.env.SESSION_KV, sessionId);
  if (!session) session = await rebuildSession(c.env.DB, characterId, sessionId);

  if (!session.inCombat || !session.combatState) {
    return c.json({ error: 'You are not currently in combat.' }, 400);
  }

  const combatState = session.combatState;

  // TODO 1 — Resolve the round mechanically. This is the ONLY place dice get rolled;
  //   the AI never rolls. Call:
  //     const result = resolveCombatRound(character, combatState, action);
  //   from ../services/combat.js (the file you just built above).

  // TODO 2 — Apply result.playerHpDelta to the character's HP, clamped between 0 and
  //   character.max_hp. If result.victory, add result.xpGained to character.xp.
  //   Persist both in one call: updateCharacter(c.env.DB, characterId, { hp, xp? }).

  // TODO 3 — On victory, roll loot and grant it:
  //     const loot = await rollLoot(c.env.DB, combatState.monster);
  //     await grantLoot(c.env.DB, characterId, loot);

  // TODO 4 — Build a short human-readable description of the player's action (e.g.
  //   "attacks the Goblin", "attempts to flee from the Goblin") and call:
  //     const dmResponse = await askDM(c.env.AI, { ...character, hp: newHp }, session,
  //       playerActionText, result.contextForDM);
  //   `result.contextForDM` is the Combat Prompt Addendum data from PRD 8.3 — the AI
  //   narrates it, it must never contradict those numbers.

  // TODO 5 — Append both turns to session history with appendHistory(session, ...), then
  //   either clear session.inCombat / session.combatState (if result.combatEnded) or
  //   advance combatState.round and apply result.enemyHpDelta to the monster's HP.
  //   Persist with saveSession(c.env.SESSION_KV, sessionId, session).

  // TODO 6 — Write both turns ('player' and 'dm') to the D1 `adventure_log` table via
  //   c.env.DB.batch([...]).

  // TODO 7 — Re-fetch the character, check shouldLevelUp(updatedCharacter), and return
  //   the shape from PRD 9 (`POST /api/combat/resolve`):
  //     { narrative, combatState, combatEnded, victory, playerDied, xpGained, loot,
  //       diceRolls, suggestedActions, updatedCharacter, canLevelUp, inCombat }

  return c.json({ error: 'combat/resolve not implemented' }, 501);
});
