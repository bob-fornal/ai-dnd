import { Hono } from 'hono';
import type { Env } from '../types/index.js';
import { createCharacter, getCharacter, getInventory } from '../services/character.js';
import { newSession, saveSession } from '../services/session.js';
import type { CreateCharacterBody } from '../types/index.js';

export const characterRoutes = new Hono<{ Bindings: Env }>();

// POST /api/character/create
characterRoutes.post('/create', async (c) => {
  let body: CreateCharacterBody;
  try {
    body = await c.req.json<CreateCharacterBody>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate required fields
  const { name, race, class: cls, abilityRollMethod } = body;
  if (!name?.trim() || !race || !cls) {
    return c.json({ error: 'name, race, and class are required' }, 400);
  }
  if (name.trim().length > 40) {
    return c.json({ error: 'Name must be 40 characters or fewer' }, 400);
  }

  // Simple sanitize — strip HTML-like characters
  const sanitizedName = name.trim().replace(/[<>'"]/g, '');

  const sessionId = crypto.randomUUID();

  try {
    // TODO:
    // 1. Call createCharacter(c.env.DB, { ...body, name: sanitizedName,
    //    abilityRollMethod: abilityRollMethod ?? 'standard' }, sessionId).
    // 2. Build a fresh session with newSession(character.id) and persist it
    //    with saveSession(c.env.SESSION_KV, sessionId, session).
    // 3. Compose an opening narrative string (no AI yet — that's Phase 4)
    //    introducing the character and session.location.
    // 4. Return c.json({ characterId, sessionId, character, backstory: '',
    //    startNarrative }).
    throw new Error('not implemented');
  } catch (err) {
    console.error('Character creation error:', err);
    return c.json({ error: 'Failed to create character' }, 500);
  }
});

// GET /api/character/:id
characterRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    // TODO:
    // 1. const character = await getCharacter(c.env.DB, id);
    //    return a 404 c.json({ error: 'Character not found' }) if null.
    // 2. const inventory = await getInventory(c.env.DB, id);
    // 3. Fetch the active quest row (SELECT * FROM quests WHERE id = ?,
    //    hardcoded to 1 for this phase).
    // 4. Return c.json({ character, inventory, activeQuest }).
    throw new Error('not implemented');
  } catch (err) {
    console.error('Get character error:', err);
    return c.json({ error: 'Failed to fetch character' }, 500);
  }
});

// PATCH /api/character/:id/equip  — toggle equipped state
characterRoutes.patch('/:id/equip', async (c) => {
  const { id } = c.req.param();
  let body: { itemId: number; equipped: boolean };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { itemId, equipped } = body;
  if (typeof itemId !== 'number' || typeof equipped !== 'boolean') {
    return c.json({ error: 'itemId (number) and equipped (boolean) are required' }, 400);
  }

  try {
    const item = await c.env.DB.prepare(
      'SELECT ci.*, i.type FROM character_inventory ci JOIN items i ON ci.item_id = i.id WHERE ci.character_id = ? AND ci.item_id = ?'
    ).bind(id, itemId).first<{ type: string; quantity: number }>();
    if (!item) return c.json({ error: 'Item not in inventory' }, 404);

    // Unequip any existing item of the same type before equipping new one
    if (equipped && (item.type === 'weapon' || item.type === 'armor')) {
      await c.env.DB.prepare(`
        UPDATE character_inventory ci
        SET equipped = 0
        WHERE character_id = ?
          AND equipped = 1
          AND item_id IN (SELECT id FROM items WHERE type = ?)
      `).bind(id, item.type).run();
    }

    await c.env.DB.prepare(
      'UPDATE character_inventory SET equipped = ? WHERE character_id = ? AND item_id = ?'
    ).bind(equipped ? 1 : 0, id, itemId).run();

    const inventory = await getInventory(c.env.DB, id);
    return c.json({ success: true, inventory });
  } catch (err) {
    console.error('Equip error:', err);
    return c.json({ error: 'Failed to update equipment' }, 500);
  }
});

// DELETE /api/character/:id/inventory/:itemId  — drop item
characterRoutes.delete('/:id/inventory/:itemId', async (c) => {
  const characterId = c.req.param('id');
  const itemId = parseInt(c.req.param('itemId'), 10);

  if (isNaN(itemId)) return c.json({ error: 'Invalid itemId' }, 400);

  try {
    const inv = await c.env.DB.prepare(
      'SELECT * FROM character_inventory WHERE character_id = ? AND item_id = ?'
    ).bind(characterId, itemId).first<{ quantity: number; equipped: number }>();
    if (!inv) return c.json({ error: 'Item not in inventory' }, 404);

    if (inv.quantity > 1) {
      await c.env.DB.prepare(
        'UPDATE character_inventory SET quantity = quantity - 1 WHERE character_id = ? AND item_id = ?'
      ).bind(characterId, itemId).run();
    } else {
      await c.env.DB.prepare(
        'DELETE FROM character_inventory WHERE character_id = ? AND item_id = ?'
      ).bind(characterId, itemId).run();
    }

    const inventory = await getInventory(c.env.DB, characterId);
    return c.json({ success: true, inventory });
  } catch (err) {
    console.error('Drop item error:', err);
    return c.json({ error: 'Failed to drop item' }, 500);
  }
});
