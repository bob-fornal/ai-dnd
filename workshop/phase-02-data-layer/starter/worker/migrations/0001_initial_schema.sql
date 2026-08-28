-- Migration: 0001_initial_schema
-- AI D&D Game — Initial D1 Schema
--
-- This is the first (and, for this workshop, only) D1 migration. Wrangler
-- tracks which migration files have already been applied to a given D1
-- database (locally in .wrangler/state, remotely in a bookkeeping table),
-- so re-running `wrangler d1 migrations apply` is always safe.
--
-- Your job: write a `CREATE TABLE IF NOT EXISTS` statement for each table
-- below. See PRD.md section 7 ("Data Model") for the exact column list,
-- types, and defaults for every table — copy the shape from there, this
-- file just tells you which tables to build and in what order (later
-- tables reference earlier ones via FOREIGN KEY / REFERENCES, so build
-- top-to-bottom).
--
-- Tip: SQLite has no native BOOLEAN — model booleans as INTEGER (0/1), and
-- JSON payloads (like an item's `effect`) are stored as TEXT.

-- TODO: CREATE TABLE characters ( ... )

-- TODO: CREATE TABLE items ( ... )

-- TODO: CREATE TABLE character_inventory ( ... )  -- references characters(id), items(id)

-- TODO: CREATE TABLE monsters ( ... )  -- references loot_tables(id)

-- TODO: CREATE TABLE loot_tables ( ... )  -- references items(id)

-- TODO: CREATE TABLE adventure_log ( ... )  -- references characters(id)
-- Also add: CREATE INDEX idx_log_session ON adventure_log(session_id, created_at DESC);

-- TODO: CREATE TABLE quests ( ... )

-- TODO: CREATE TABLE shops ( ... )

-- TODO: CREATE TABLE shop_inventory ( ... )  -- references shops(id), items(id); composite PRIMARY KEY (shop_id, item_id)
