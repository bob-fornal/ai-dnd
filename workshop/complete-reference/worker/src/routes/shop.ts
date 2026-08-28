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

  const { results } = await c.env.DB.prepare(`
    SELECT si.item_id, si.stock, i.name, i.type, i.effect, i.value, i.weight
    FROM shop_inventory si
    JOIN items i ON si.item_id = i.id
    WHERE si.shop_id = ?
  `).bind(shopId).all();

  return c.json({ shop, items: results });
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
    const totalCost = item.value * quantity;
    if (character.gold < totalCost) {
      return c.json({ error: `Not enough gold. Need ${totalCost}gp, have ${character.gold}gp.` }, 400);
    }

    // Check stock
    const stock = await c.env.DB.prepare(
      'SELECT stock FROM shop_inventory WHERE shop_id = ? AND item_id = ?'
    ).bind(shopId, itemId).first<{ stock: number }>();
    if (!stock) return c.json({ error: 'Item not available in this shop' }, 404);
    if (stock.stock !== -1 && stock.stock < quantity) {
      return c.json({ error: `Only ${stock.stock} in stock` }, 400);
    }

    await c.env.DB.batch([
      // Deduct gold
      c.env.DB.prepare(
        `UPDATE characters SET gold = gold - ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(totalCost, characterId),
      // Add to inventory
      c.env.DB.prepare(`
        INSERT INTO character_inventory (character_id, item_id, quantity, equipped)
        VALUES (?, ?, ?, 0)
        ON CONFLICT(character_id, item_id) DO UPDATE SET quantity = quantity + excluded.quantity
      `).bind(characterId, itemId, quantity),
      // Reduce stock if limited
      ...(stock.stock !== -1
        ? [c.env.DB.prepare(
            'UPDATE shop_inventory SET stock = stock - ? WHERE shop_id = ? AND item_id = ?'
          ).bind(quantity, shopId, itemId)]
        : []),
    ]);

    const updated = await getCharacter(c.env.DB, characterId);
    return c.json({ success: true, action: 'buy', item: item.name, quantity, cost: totalCost, updatedGold: updated?.gold });
  }

  if (action === 'sell') {
    const salePrice = Math.floor(item.value * 0.5) * quantity; // sell at half value

    // Verify player has the item
    const inv = await c.env.DB.prepare(
      'SELECT * FROM character_inventory WHERE character_id = ? AND item_id = ?'
    ).bind(characterId, itemId).first<{ quantity: number }>();
    if (!inv || inv.quantity < quantity) {
      return c.json({ error: 'You do not have enough of this item to sell' }, 400);
    }

    await c.env.DB.batch([
      // Add gold
      c.env.DB.prepare(
        `UPDATE characters SET gold = gold + ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(salePrice, characterId),
      // Remove from inventory
      inv.quantity === quantity
        ? c.env.DB.prepare('DELETE FROM character_inventory WHERE character_id = ? AND item_id = ?').bind(characterId, itemId)
        : c.env.DB.prepare('UPDATE character_inventory SET quantity = quantity - ? WHERE character_id = ? AND item_id = ?').bind(quantity, characterId, itemId),
    ]);

    const updated = await getCharacter(c.env.DB, characterId);
    return c.json({ success: true, action: 'sell', item: item.name, quantity, earned: salePrice, updatedGold: updated?.gold });
  }

  return c.json({ error: 'Invalid action — must be buy or sell' }, 400);
});
