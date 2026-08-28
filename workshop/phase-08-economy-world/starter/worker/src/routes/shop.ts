import { Hono } from 'hono';
import type { Env, ShopTransactionBody } from '../types/index.js';
import { getCharacter, updateCharacter } from '../services/character.js';

export const shopRoutes = new Hono<{ Bindings: Env }>();

// GET /api/shop/:id  — list shop inventory
shopRoutes.get('/:id', async (c) => {
  const shopId = parseInt(c.req.param('id'), 10);

  const shop = await c.env.DB.prepare(
    'SELECT * FROM shops WHERE id = ?'
  ).bind(shopId).first();
  if (!shop) return c.json({ error: 'Shop not found' }, 404);

  // TODO: SELECT the shop's stock joined with item details — si.item_id, si.stock,
  //   i.name, i.type, i.effect, i.value, i.weight FROM shop_inventory si JOIN items i
  //   ON si.item_id = i.id WHERE si.shop_id = ?.
  const items: unknown[] = [];

  return c.json({ shop, items });
});

// POST /api/shop/transaction
shopRoutes.post('/transaction', async (c) => {
  let body: ShopTransactionBody;
  try {
    body = await c.req.json<ShopTransactionBody>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { characterId, shopId, action, itemId, quantity } = body;
  if (!characterId || !shopId || !action || !itemId || !quantity) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const character = await getCharacter(c.env.DB, characterId);
  if (!character) return c.json({ error: 'Character not found' }, 404);

  // Load item
  const item = await c.env.DB.prepare(
    'SELECT * FROM items WHERE id = ?'
  ).bind(itemId).first<{ id: number; name: string; value: number; weight: number }>();
  if (!item) return c.json({ error: 'Item not found' }, 404);

  if (action === 'buy') {
    // TODO — Gold math: totalCost = item.value * quantity. Return a 400 ("Not enough
    //   gold. Need Xgp, have Ygp.") if character.gold < totalCost.
    //
    // TODO — Stock check: SELECT stock FROM shop_inventory WHERE shop_id = ? AND
    //   item_id = ?. A missing row means the item isn't sold here (404). A `stock` of
    //   -1 means unlimited; otherwise reject with 400 if stock < quantity.
    //
    // TODO — (PRD F-20, D1 durable-write pattern) Weight limit: a character can carry
    //   character.str * 15 lbs total. If you want to enforce it, sum the character's
    //   current inventory weight (join character_inventory → items) plus
    //   item.weight * quantity, and reject over the limit.
    //
    // TODO — Persist everything in a single db.batch([...]) so it's atomic:
    //     1. UPDATE characters SET gold = gold - totalCost WHERE id = characterId
    //     2. INSERT INTO character_inventory (character_id, item_id, quantity, equipped)
    //        VALUES (?, ?, ?, 0) ON CONFLICT(character_id, item_id) DO UPDATE SET
    //        quantity = quantity + excluded.quantity
    //     3. UPDATE shop_inventory SET stock = stock - quantity ... (only when stock !== -1)
    //
    // TODO — Re-fetch the character and respond:
    //   { success: true, action: 'buy', item: item.name, quantity, cost: totalCost,
    //     updatedGold: updated?.gold }.
    return c.json({ error: 'buy not implemented' }, 501);
  }

  if (action === 'sell') {
    // TODO — Sale price: sell at half value, floored — Math.floor(item.value * 0.5) *
    //   quantity.
    //
    // TODO — Verify the character actually holds enough of the item: SELECT * FROM
    //   character_inventory WHERE character_id = ? AND item_id = ?; reject with 400 if
    //   missing or inv.quantity < quantity.
    //
    // TODO — Persist with db.batch([...]): add gold to `characters`, and either DELETE
    //   the inventory row (selling the whole stack) or decrement its quantity.
    //
    // TODO — Re-fetch the character and respond:
    //   { success: true, action: 'sell', item: item.name, quantity, earned: salePrice,
    //     updatedGold: updated?.gold }.
    return c.json({ error: 'sell not implemented' }, 501);
  }

  return c.json({ error: 'Invalid action — must be buy or sell' }, 400);
});
