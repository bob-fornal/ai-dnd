import { Hono } from 'hono';
import type { Env, ActionBody } from '../types/index.js';
import { getCharacter, updateCharacter, shouldLevelUp } from '../services/character.js';
import { loadSession, saveSession, appendHistory, rebuildSession } from '../services/session.js';
import { askDM } from '../services/ai-dm.js';
import { selectMonster, initCombat } from '../services/combat.js';

export const actionRoutes = new Hono<{ Bindings: Env }>();

// POST /api/action — core game loop endpoint
actionRoutes.post('/', async (c) => {
  try {
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

  // Sanitize player input — strip HTML, limit length. This is the app's main
  // prompt-injection defense (PRD NF-03 / US-15): raw player text never reaches
  // the model unfiltered, and the system prompt it's inserted into is never
  // exposed back to the client.
  const sanitizedAction = action
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 500);

  // TODO: Load the character from D1.
  //   const character = await getCharacter(c.env.DB, characterId);
  //   if (!character) return c.json({ error: 'Character not found' }, 404);

  // TODO: Load the session from KV.
  //   let session = await loadSession(c.env.SESSION_KV, sessionId);
  // KV sessions expire after 7 days of inactivity (PRD F-25). If loadSession
  // returns nothing, rebuild the session from the durable D1 adventure log:
  //   if (!session) session = await rebuildSession(c.env.DB, characterId, sessionId);

  // TODO: Guard — reject if the character is already in combat. Combat turns
  // go through the dedicated /api/combat/resolve endpoint (Phase 7), where the
  // Worker — not the AI — rolls the dice. This endpoint is for exploration and
  // social encounters only.
  //   if (session.inCombat) {
  //     return c.json({
  //       error: 'You are in combat! Use /api/combat/resolve to take combat actions.',
  //       inCombat: true,
  //     }, 400);
  //   }

  // TODO: Ask the AI DM — this calls the askDM() you built in
  // services/ai-dm.ts.
  //   const dmResponse = await askDM(c.env.AI, character, session, sanitizedAction);

  // TODO: Apply dmResponse.gameStateChanges to the character:
  //   - hpDelta: clamp the new HP between 0 and character.max_hp
  //   - xpGained: only apply when greater than 0
  //   - goldDelta: clamp the new total to >= 0
  //   Collect the changed fields into an update object and only call
  //   updateCharacter(c.env.DB, characterId, updates) if something changed.
  //   Remember: the Worker is the source of truth for these numbers (PRD 6.1) —
  //   the AI only decided *that* something changed, never by how much beyond
  //   what it narrated.

  // TODO: Update the session:
  //   - appendHistory(session, 'player', sanitizedAction)
  //   - appendHistory(session, 'dm', dmResponse.narrative)
  //   - if changes.locationChange, set session.location
  //   - if changes.questUpdate, set session.activeQuestSummary
  //   - if changes.combatInitiated && !session.inCombat:
  //       const monster = await selectMonster(c.env.DB, character.level);
  //       session.combatState = initCombat(monster);
  //       session.inCombat = true;
  //   - persist with await saveSession(c.env.SESSION_KV, sessionId, session)

  // TODO: Append both turns to the D1 adventure_log table (PRD F-26). Use
  // c.env.DB.batch([...]) with two prepared INSERT statements so both writes
  // commit together:
  //   INSERT INTO adventure_log (session_id, character_id, actor, content) VALUES (?,?,?,?)
  // once for actor='player' with sanitizedAction, once for actor='dm' with
  // dmResponse.narrative.

  // TODO: Re-fetch the character (getCharacter) so the response reflects the
  // updates just written, then compute canLevelUp via
  // shouldLevelUp(updatedCharacter).

  // TODO: Return the response shape from PRD.md section 9:
  //   return c.json({
  //     narrative:        dmResponse.narrative,
  //     gameStateChanges: changes,
  //     suggestedActions: dmResponse.suggestedActions,
  //     diceRolls:        dmResponse.diceRolls,
  //     updatedCharacter,
  //     inCombat:         session.inCombat,
  //     combatState:      session.combatState,
  //     canLevelUp,
  //   });

  return c.json({ error: 'Not implemented' }, 501);
  } catch (err: any) {
    console.error('[action] Unhandled error:', err);
    return c.json(
      { error: 'Internal server error', detail: err?.message ?? 'Unknown error' },
      500
    );
  }
});
