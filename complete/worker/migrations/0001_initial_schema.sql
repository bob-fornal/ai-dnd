-- Migration: 0001_initial_schema
-- AI D&D Game — Initial D1 Schema

-- ─── Characters ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS characters (
  id          TEXT    PRIMARY KEY,
  session_id  TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  race        TEXT    NOT NULL,
  class       TEXT    NOT NULL,
  level       INTEGER NOT NULL DEFAULT 1,
  xp          INTEGER NOT NULL DEFAULT 0,
  hp          INTEGER NOT NULL,
  max_hp      INTEGER NOT NULL,
  ac          INTEGER NOT NULL,
  gold        INTEGER NOT NULL DEFAULT 50,
  str         INTEGER NOT NULL DEFAULT 10,
  dex         INTEGER NOT NULL DEFAULT 10,
  con         INTEGER NOT NULL DEFAULT 10,
  int         INTEGER NOT NULL DEFAULT 10,
  wis         INTEGER NOT NULL DEFAULT 10,
  cha         INTEGER NOT NULL DEFAULT 10,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── Items ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT    NOT NULL,
  type    TEXT    NOT NULL CHECK (type IN ('weapon','armor','potion','misc')),
  effect  TEXT    NOT NULL DEFAULT '{}',  -- JSON
  value   INTEGER NOT NULL DEFAULT 0,
  weight  REAL    NOT NULL DEFAULT 0
);

-- ─── Character Inventory ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS character_inventory (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id TEXT    NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_id      INTEGER NOT NULL REFERENCES items(id),
  quantity     INTEGER NOT NULL DEFAULT 1,
  equipped     INTEGER NOT NULL DEFAULT 0  -- 0=false, 1=true
);

-- ─── Monsters ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monsters (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  cr            REAL    NOT NULL DEFAULT 0.125,
  hp            INTEGER NOT NULL,
  max_hp        INTEGER NOT NULL,
  ac            INTEGER NOT NULL,
  attack_bonus  INTEGER NOT NULL DEFAULT 2,
  damage_dice   TEXT    NOT NULL DEFAULT '1d6',
  xp_reward     INTEGER NOT NULL DEFAULT 25,
  loot_table_id INTEGER REFERENCES loot_tables(id)
);

-- ─── Loot Tables ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loot_tables (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  monster_id   INTEGER NOT NULL,
  item_id      INTEGER NOT NULL REFERENCES items(id),
  drop_chance  REAL    NOT NULL DEFAULT 0.5  -- 0.0–1.0
);

-- ─── Adventure Log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adventure_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT    NOT NULL,
  character_id TEXT    NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  actor        TEXT    NOT NULL CHECK (actor IN ('player','dm','system')),
  content      TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_log_session ON adventure_log(session_id, created_at DESC);

-- ─── Quests ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL,
  location    TEXT    NOT NULL DEFAULT 'The Crossroads',
  level_min   INTEGER NOT NULL DEFAULT 1,
  level_max   INTEGER NOT NULL DEFAULT 10,
  xp_reward   INTEGER NOT NULL DEFAULT 100,
  gold_reward INTEGER NOT NULL DEFAULT 25
);

-- ─── Shops ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT    NOT NULL,
  location TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_inventory (
  shop_id  INTEGER NOT NULL REFERENCES shops(id),
  item_id  INTEGER NOT NULL REFERENCES items(id),
  stock    INTEGER NOT NULL DEFAULT -1,  -- -1 = unlimited
  PRIMARY KEY (shop_id, item_id)
);
