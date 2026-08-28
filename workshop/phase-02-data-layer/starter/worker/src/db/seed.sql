-- Seed data for the AI D&D game world.
--
-- IMPORTANT: none of these tables declare explicit primary keys in their
-- INSERT statements — ids come from SQLite's AUTOINCREMENT, assigned in the
-- order rows are inserted. Downstream tables (loot_tables, shop_inventory)
-- reference items/monsters by that numeric id. So: when you add more rows
-- of your own, APPEND them after the examples below rather than
-- reordering/removing existing rows, or the ids referenced further down
-- this file will point at the wrong item/monster.
--
-- items and monsters are kept fully populated below (they're the reference
-- data everything else hangs off of, and later workshop phases — combat,
-- shops, loot — need a real bestiary/catalog to work against). loot_tables,
-- quests, and shops are trimmed to one worked example each; follow the
-- pattern and add your own.

-- ─── Seed: Items ─────────────────────────────────────────────────────────────

-- Weapons
INSERT INTO items (name, type, effect, value, weight) VALUES
  ('Shortsword',       'weapon', '{"damage":"1d6","attack_bonus":2}',  10,  2.0),
  ('Longsword',        'weapon', '{"damage":"1d8","attack_bonus":2}',  15,  3.0),
  ('Dagger',           'weapon', '{"damage":"1d4","attack_bonus":2}',   2,  1.0),
  ('Handaxe',          'weapon', '{"damage":"1d6","attack_bonus":2}',   5,  2.0),
  ('Quarterstaff',     'weapon', '{"damage":"1d6","attack_bonus":1}',   0,  4.0),
  ('Shortbow',         'weapon', '{"damage":"1d6","attack_bonus":2}',  25,  2.0),
  ('Greataxe',         'weapon', '{"damage":"1d12","attack_bonus":3}', 30,  7.0),
  ('Rapier',           'weapon', '{"damage":"1d8","attack_bonus":3}',  25,  2.0),
  ('Warhammer',        'weapon', '{"damage":"1d8","attack_bonus":2}',  15,  5.0),
  ('Staff of Sparks',  'weapon', '{"damage":"1d6","attack_bonus":2,"magic":true}', 80, 3.0);

-- Armor
INSERT INTO items (name, type, effect, value, weight) VALUES
  ('Leather Armor',    'armor', '{"ac_bonus":1}',  10, 10.0),
  ('Chain Shirt',      'armor', '{"ac_bonus":3}',  50, 20.0),
  ('Scale Mail',       'armor', '{"ac_bonus":4}',  50, 45.0),
  ('Plate Armor',      'armor', '{"ac_bonus":6}', 150, 65.0),
  ('Shield',           'armor', '{"ac_bonus":2}',  10,  6.0),
  ('Mage Robe',        'armor', '{"ac_bonus":0,"int_bonus":1}', 20, 4.0);

-- Potions
INSERT INTO items (name, type, effect, value, weight) VALUES
  ('Potion of Healing',         'potion', '{"heal":"2d4+2"}',  50, 0.5),
  ('Potion of Greater Healing', 'potion', '{"heal":"4d4+4"}', 150, 0.5),
  ('Potion of Fire Breath',     'potion', '{"damage":"4d6","area":true}', 100, 0.5),
  ('Antitoxin',                 'potion', '{"condition_clear":"poisoned"}', 50, 0.5),
  ('Elixir of Health',          'potion', '{"heal":"2d8+4","max_hp_temp":5}', 200, 0.5);

-- Misc
INSERT INTO items (name, type, effect, value, weight) VALUES
  ('Rope (50 ft)',       'misc', '{}',   1, 10.0),
  ('Torchx5',            'misc', '{}',   1,  5.0),
  ('Rations (1 day)',    'misc', '{}',   0,  2.0),
  ('Thieves Tools',      'misc', '{"skill_bonus":"stealth+2"}', 25,  1.0),
  ('Spellbook',          'misc', '{"spell_slots":1}', 50,  3.0),
  ('Lucky Charm',        'misc', '{"advantage_once":true}', 75,  0.1),
  ('Amulet of Protection','misc','{"ac_bonus":1,"magic":true}', 120, 0.1);

-- TODO: add more items rows — see PRD.md section 4.4 (Inventory & Economy)
-- for the item shape ({id, name, type, effect, value, weight}). Append new
-- rows here; don't renumber the ones above.

-- ─── Seed: Monsters ──────────────────────────────────────────────────────────
INSERT INTO monsters (name, cr, hp, max_hp, ac, attack_bonus, damage_dice, xp_reward, loot_table_id) VALUES
  -- CR 0–0.5 (Level 1–2 fodder)
  ('Giant Rat',        0.125,  7,  7, 10, 2, '1d4',    10, NULL),
  ('Kobold',           0.125,  5,  5, 12, 4, '1d4+2',  25, NULL),
  ('Skeleton',         0.25,  13, 13, 13, 4, '1d6+2',  50, NULL),
  ('Goblin',           0.25,   7,  7, 15, 4, '1d6+2',  50, NULL),
  ('Zombie',           0.25,  22, 22,  8, 3, '1d6+1',  50, NULL),
  -- CR 0.5–1 (Level 2–4)
  ('Orc Scout',        0.5,   15, 15, 11, 5, '1d8+3',  100, NULL),
  ('Giant Spider',     1,     26, 26, 14, 5, '1d8+3',  200, NULL),
  ('Bandit Captain',   2,     65, 65, 15, 7, '2d6+4',  450, NULL),
  -- CR 2–5 (Level 4–8)
  ('Werewolf',         3,     58, 58, 12, 5, '2d6+3',  700, NULL),
  ('Troll',            5,    115,115, 15, 7, '2d6+4', 1800, NULL),
  ('Vampire Spawn',    5,     82, 82, 15, 6, '2d6+3', 1800, NULL),
  -- CR 6+ (Level 8–10)
  ('Young Dragon',     7,    178,178, 17, 8, '2d10+5',2900, NULL),
  ('Lich',             21,   135,135, 17,12, '4d6',  33000, NULL);

-- TODO: add more monsters rows — see PRD.md section 7 (Data Model) for the
-- `monsters` column list. Pick a `cr` in line with the level range you want
-- it to appear at (Worker code will match monsters to players by CR).

-- ─── Seed: Loot Tables ───────────────────────────────────────────────────────
-- Worked example: Goblin (monster id 4) can drop a Dagger (item id 3) or a
-- Shortsword (item id 1). Row order above means Goblin really is id 4 and
-- Dagger/Shortsword really are ids 3/1 — double-check with
-- `select id, name from monsters` / `select id, name from items` if you're
-- ever unsure.
INSERT INTO loot_tables (monster_id, item_id, drop_chance) VALUES
  (4, 3, 0.6),   -- Goblin → Dagger 60%
  (4, 1, 0.3);   -- Goblin → Shortsword 30%

-- TODO: add more loot_tables rows for the other monsters above (Skeleton,
-- Orc Scout, etc.) — `drop_chance` is 0.0–1.0.

-- ─── Seed: Quests ────────────────────────────────────────────────────────────
INSERT INTO quests (title, description, location, level_min, level_max, xp_reward, gold_reward) VALUES
  (
    'The Stolen Amulet',
    'The village elder begs you to retrieve a stolen family heirloom — a silver amulet — taken by goblin raiders who fled into Darkwood Forest. The goblins are numerous, but their leader, a cunning creature named Snikkit, holds the amulet as a trophy.',
    'Darkwood Forest',
    1, 3, 300, 50
  );

-- TODO: add more quests rows — see PRD.md section 4.7 for how xp_reward
-- ties into the level-up thresholds (XP_THRESHOLDS in types/index.ts).

-- ─── Seed: Shops ─────────────────────────────────────────────────────────────
INSERT INTO shops (name, location) VALUES
  ('Aldric''s Armory', 'Millhaven');

-- Aldric's Armory stock (shop id 1)
INSERT INTO shop_inventory (shop_id, item_id, stock) VALUES
  (1, 1, -1),   -- Shortsword
  (1, 2, -1),   -- Longsword
  (1, 3, -1),   -- Dagger
  (1, 4, -1),   -- Handaxe
  (1, 11, -1),  -- Leather Armor
  (1, 12, -1),  -- Chain Shirt
  (1, 15, -1),  -- Shield
  (1, 17, 10),  -- Potion of Healing (limited)
  (1, 22, -1),  -- Rope
  (1, 23, -1);  -- Torches

-- TODO: add more shops + shop_inventory rows (e.g. a second shop at a
-- different location). `stock = -1` means unlimited.
