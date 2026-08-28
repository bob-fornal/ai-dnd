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

  // ── Resolve the round mechanically ───────────────────────────────────────
  const result = resolveCombatRound(character, combatState, action);

  // ── Apply HP changes ─────────────────────────────────────────────────────
  const charUpdates: Parameters<typeof updateCharacter>[2] = {};
  let newHp = character.hp + result.playerHpDelta;
  newHp = Math.max(0, Math.min(character.max_hp, newHp));
  charUpdates.hp = newHp;

  // Apply XP if victory
  if (result.victory && result.xpGained > 0) {
    charUpdates.xp = character.xp + result.xpGained;
  }

  await updateCharacter(c.env.DB, characterId, charUpdates);

  // ── Handle loot on victory ───────────────────────────────────────────────
  let loot: { itemId: number; name: string }[] = [];
  if (result.victory) {
    loot = await rollLoot(c.env.DB, combatState.monster);
    await grantLoot(c.env.DB, characterId, loot);
  }

  // ── Ask DM to narrate the round ──────────────────────────────────────────
  const playerActionText = {
    attack:   `attacks the ${combatState.monster.name}`,
    dodge:    `dodges, focusing on defence`,
    flee:     `attempts to flee from the ${combatState.monster.name}`,
    use_item: `uses an item during combat`,
  }[action];

  const dmResponse = await askDM(
    c.env.AI,
    { ...character, hp: newHp }, // pass updated HP
    session,
    playerActionText,
    result.contextForDM,
  );

  // ── Update session state ─────────────────────────────────────────────────
  appendHistory(session, 'player', playerActionText);
  appendHistory(session, 'dm', dmResponse.narrative);

  if (result.combatEnded) {
    session.inCombat = false;
    session.combatState = null;
  } else {
    // Update monster HP
    session.combatState = {
      ...combatState,
      round: combatState.round + 1,
      monster: {
        ...combatState.monster,
        hp: Math.max(0, combatState.monster.hp + result.enemyHpDelta),
      },
    };
  }

  await saveSession(c.env.SESSION_KV, sessionId, session);

  // ── Log to D1 ────────────────────────────────────────────────────────────
  await c.env.DB.batch([
    c.env.DB.prepare(
      'INSERT INTO adventure_log (session_id, character_id, actor, content) VALUES (?,?,?,?)'
    ).bind(sessionId, characterId, 'player', `[Combat] ${playerActionText}`),
    c.env.DB.prepare(
      'INSERT INTO adventure_log (session_id, character_id, actor, content) VALUES (?,?,?,?)'
    ).bind(sessionId, characterId, 'dm', dmResponse.narrative),
  ]);

  // Refresh character for response
  const updatedCharacter = await getCharacter(c.env.DB, characterId);
  const canLevelUp = updatedCharacter ? shouldLevelUp(updatedCharacter) : false;
  const playerDied = newHp <= 0;

  return c.json({
    narrative:      dmResponse.narrative,
    combatState:    session.combatState ?? null,
    combatEnded:    result.combatEnded,
    victory:        result.victory,
    playerDied,
    xpGained:       result.xpGained,
    loot,
    diceRolls:      result.diceRolls,
    suggestedActions: dmResponse.suggestedActions,
    updatedCharacter,
    canLevelUp,
    inCombat:       session.inCombat,
  });
});
