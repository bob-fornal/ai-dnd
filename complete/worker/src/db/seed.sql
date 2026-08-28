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

-- ─── Seed: Loot Tables ───────────────────────────────────────────────────────
-- Goblin drops
INSERT INTO loot_tables (monster_id, item_id, drop_chance) VALUES
  (4, 3, 0.6),   -- Goblin → Dagger 60%
  (4, 1, 0.3);   -- Goblin → Shortsword 30%

-- Skeleton drops
INSERT INTO loot_tables (monster_id, item_id, drop_chance) VALUES
  (3, 1, 0.4),   -- Skeleton → Shortsword 40%
  (3, 11, 0.3);  -- Skeleton → Leather Armor 30%

-- Orc drops
INSERT INTO loot_tables (monster_id, item_id, drop_chance) VALUES
  (6, 4, 0.5),   -- Orc → Handaxe 50%
  (6, 17, 0.4);  -- Orc → Potion of Healing 40%

-- ─── Seed: Quests ────────────────────────────────────────────────────────────
INSERT INTO quests (title, description, location, level_min, level_max, xp_reward, gold_reward) VALUES
  (
    'The Stolen Amulet',
    'The village elder begs you to retrieve a stolen family heirloom — a silver amulet — taken by goblin raiders who fled into Darkwood Forest. The goblins are numerous, but their leader, a cunning creature named Snikkit, holds the amulet as a trophy.',
    'Darkwood Forest',
    1, 3, 300, 50
  ),
  (
    'Plague of the Undead',
    'Skeletal warriors have risen from the old cemetery on the hill outside Millhaven. The local priest believes a dark necromancer is raising them. Investigate the cemetery, defeat the undead, and find the source of the dark magic.',
    'Millhaven Cemetery',
    2, 5, 600, 100
  ),
  (
    'The Dragon''s Hoard',
    'Rumours spread of a young dragon that has made its lair in the abandoned mines of Ironpeak. Local merchants have lost three caravans to its raids. The Merchants'' Guild offers a handsome reward for proof of the dragon''s defeat.',
    'Ironpeak Mines',
    6, 10, 2900, 500
  ),
  (
    'Shadows in the Inn',
    'You arrive at the Rusty Flagon Inn to find the innkeeper nervous and the other patrons whispering. Someone — or something — has been stealing from guests in the night. The innkeeper suspects one of the guests, but fears the truth may be darker.',
    'Rusty Flagon Inn',
    1, 2, 150, 30
  ),
  (
    'The Bandit King',
    'A notorious bandit captain named Gorvan the Red has set up a toll on the King''s Road, extorting merchants and travellers. The local garrison is stretched thin. Drive Gorvan and his crew from their camp in the old mill.',
    'King''s Road Mill',
    3, 6, 800, 150
  );

-- ─── Seed: Shops ─────────────────────────────────────────────────────────────
INSERT INTO shops (name, location) VALUES
  ('Aldric''s Armory',      'Millhaven'),
  ('The Rusty Flagon Store', 'Rusty Flagon Inn'),
  ('Wandering Merchant',    'King''s Road');

-- Aldric's Armory stock
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

-- Inn store stock
INSERT INTO shop_inventory (shop_id, item_id, stock) VALUES
  (2, 17, 5),   -- Potion of Healing
  (2, 24, -1),  -- Rations
  (2, 22, -1);  -- Rope

-- Wandering Merchant
INSERT INTO shop_inventory (shop_id, item_id, stock) VALUES
  (3, 17, 3),
  (3, 18, 1),   -- Greater Healing
  (3, 25, 1),   -- Thieves Tools
  (3, 27, 1),   -- Lucky Charm
  (3, 3, -1);
