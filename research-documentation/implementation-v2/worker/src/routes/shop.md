# routes/shop.ts

Shop browsing and buy/sell transactions.

<!-- anchors:start -->
Anchors (`shop.ts`): `shopRoutes:5`
<!-- anchors:end -->

## Endpoints
| Method & path | Body | Response |
|---|---|---|
| `GET /api/shop/:id` | none | `{ shop, items: [{ item_id, stock, name, type, effect, value, weight }] }` |
| `POST /api/shop/transaction` | `{ sessionId, characterId, shopId, action, itemId, quantity }` | buy: `{ success, action, item, quantity, cost, updatedGold }`; sell: `{ …, earned, updatedGold }` |

## Rules & gotchas
- Buying costs `value × quantity`. It checks gold and stock (`-1` means unlimited) and decrements limited stock.
- Selling pays `floor(value × 0.5) × quantity`, verifies the quantity owned, and deletes the row when it reaches 0.
- Each transaction runs as one `DB.batch`.
- **Buying fails**: `ON CONFLICT(character_id, item_id)` needs a UNIQUE index that `character_inventory` doesn't have ([bugs.md B-02](../../../../../bugs.md)).
- Selling doesn't restock the shop or check whether the item is equipped.
- No UI calls these endpoints yet.

## Connections
**Parents (used by):**
- [../index.md](../index.md): mounted at `/api/shop`
- HTTP client methods: [game-api.service.md](../../../frontend/src/app/services/game-api.service.md) (`getShop`, `shopTransaction`)

**Children (uses):**
- [services/character.md](../services/character.md): `getCharacter`
- [types/index.md](../types/index.md): `Env`, `ShopTransactionBody`
- Tables: `shops`, `shop_inventory`, `items`, `character_inventory`, `characters`
- Spec: [PRD §4.4](../../../docs/PRD.md#44-inventory--economy)
