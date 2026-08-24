# Product Requirements Document: AI Dungeon — Cloudflare-Powered D&D

**Version:** 1.0  
**Date:** 2026-08-24  
**Author:** Bob Fornal / Leading EDJE  
**Status:** Draft

---

## 1. Overview

**AI Dungeon** is a single-player, text-driven role-playing game inspired by classic tabletop D&D. An AI Dungeon Master (powered by Cloudflare Worker AI) generates narrative, responds to player actions, drives encounters, and creates a living world. Game state and session history are persisted via Cloudflare Workers KV and D1. The frontend is an Angular SPA hosted on Cloudflare Pages.

### Vision

> "A limitless fantasy adventure where every decision matters, the story remembers you, and an AI always has the next chapter ready."

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Engaging AI narrative | Average session length | ≥ 15 minutes |
| Low latency responses | AI response time (p95) | < 3 seconds |
| Persistent game world | Sessions resumed across devices | ≥ 80% of return visits |
| Character progression | Characters with level > 1 | ≥ 50% of users |
| Reliability | Uptime (Cloudflare edge) | 99.9% |

---

## 3. User Stories

### 3.1 Player (Primary User)

- **US-01** — As a player, I can create a character with a name, race, class, and backstory so I have an identity in the game world.
- **US-02** — As a player, I can type free-form actions and receive rich narrative responses from the AI Dungeon Master.
- **US-03** — As a player, I can see my character's stats (HP, level, XP, gold, abilities) at all times.
- **US-04** — As a player, I can engage in turn-based combat with dice rolls, attack/defend choices, and visible outcomes.
- **US-05** — As a player, I can manage an inventory of items (weapons, armor, potions, loot).
- **US-06** — As a player, I can save and resume my adventure across sessions without losing progress.
- **US-07** — As a player, I can view my adventure log — a scrollable history of past narrative events.
- **US-08** — As a player, I can level up my character, gaining new abilities and stat improvements.
- **US-09** — As a player, I can visit towns, inns, and shops to buy/sell items between quests.
- **US-10** — As a player, I can start a new game or continue an existing campaign on the same account.

### 3.2 System (Backend / AI)

- **US-11** — The AI DM maintains awareness of the current quest, location, recent actions, and character state in each prompt.
- **US-12** — The system enforces D&D 5e-inspired rules (dice mechanics, ability checks, combat flow) regardless of AI output.
- **US-13** — The system detects combat, exploration, and social encounter modes and shifts AI persona accordingly.
- **US-14** — The system generates contextual encounters (monster stats, loot tables) appropriate to the player's level.
- **US-15** — The system prevents prompt injection or attempts to "jailbreak" the DM persona.

---

## 4. Functional Requirements

### 4.1 Character Creation

- **F-01** Player selects or enters: Name, Race (Human, Elf, Dwarf, Halfling, Orc, Tiefling), Class (Fighter, Wizard, Rogue, Cleric, Ranger, Bard).
- **F-02** Ability scores (STR, DEX, CON, INT, WIS, CHA) rolled via the system (4d6 drop lowest) or standard array.
- **F-03** Starting HP, AC, proficiencies, and equipment assigned by class rules.
- **F-04** Optional AI-generated backstory paragraph based on race/class/name.
- **F-05** Character saved to D1 `characters` table on creation.

### 4.2 AI Dungeon Master (Core Feature)

- **F-06** Each player action is sent to the Cloudflare Worker, which constructs a structured prompt including:
  - System persona: "You are a creative, fair, and immersive Dungeon Master for a D&D 5e-inspired game."
  - World context: current location, active quest summary, recent history (last 10 exchanges from KV).
  - Character state: name, class, race, level, HP, relevant abilities.
  - Player input (sanitized).
  - Instruction to return structured JSON with `narrative`, `gameStateChanges`, and `suggestedActions`.
- **F-07** Worker AI model: `@cf/meta/llama-3.1-8b-instruct` (primary); `@cf/mistral/mistral-7b-instruct-v0.1` (fallback).
- **F-08** AI response is parsed and validated server-side before being returned to the client.
- **F-09** The AI response JSON schema:
  ```json
  {
    "narrative": "string (1–4 paragraphs of story text)",
    "gameStateChanges": {
      "hpDelta": "number | null",
      "xpGained": "number | null",
      "goldDelta": "number | null",
      "itemsAdded": ["string"],
      "itemsRemoved": ["string"],
      "locationChange": "string | null",
      "questUpdate": "string | null",
      "combatInitiated": "boolean",
      "combatEnded": "boolean"
    },
    "suggestedActions": ["string (up to 4 quick-action suggestions)"],
    "diceRolls": [{ "type": "string", "result": "number", "reason": "string" }]
  }
  ```
- **F-10** Suggested actions rendered as clickable quick-reply chips in the UI.

### 4.3 Combat System

- **F-11** Combat is turn-based: Player acts → Worker resolves → Enemy acts → repeat until combat ends.
- **F-12** Attack rolls use D20 + attack modifier vs. enemy AC (computed server-side, not by AI).
- **F-13** Damage rolls use class/weapon dice (e.g., 1d8+STR for longsword).
- **F-14** Enemy stats (HP, AC, attack, damage) stored in D1 `monsters` table; selected by CR range matching player level.
- **F-15** Death at 0 HP: player shown death narrative; offered to load last save or restart.
- **F-16** Victory grants XP and loot from D1 `loot_tables`.

### 4.4 Inventory & Economy

- **F-17** Inventory stored in D1 `character_inventory` table (item_id, quantity, equipped).
- **F-18** Items defined in D1 `items` table (id, name, type, effect, value, weight).
- **F-19** Shop UI presents available items; buy/sell transactions update gold and inventory.
- **F-20** Weight limit enforced (STR score × 15 lbs).

### 4.5 Persistence & Sessions

- **F-21** Each game session identified by a `sessionId` (UUID) stored in Workers KV.
- **F-22** KV stores: active session context (current location, active quest, conversation history last 20 turns), keyed by `session:{sessionId}`.
- **F-23** D1 stores: durable character record, full adventure log, inventory, quest log.
- **F-24** On page load, the frontend fetches the player's active session and resumes seamlessly.
- **F-25** Sessions expire from KV after 7 days of inactivity (TTL); D1 record persists indefinitely.

### 4.6 Adventure Log

- **F-26** Every DM narrative turn is appended to D1 `adventure_log` (sessionId, timestamp, actor, content).
- **F-27** Log viewable in a collapsible panel in the UI, paginated in reverse-chronological order.

### 4.7 Level Progression

- **F-28** XP thresholds follow D&D 5e standard (Level 2: 300 XP, Level 3: 900 XP … Level 10: 64,000 XP).
- **F-29** On level up: HP increases, one ability improvement offered, new class feature narrative generated by AI.
- **F-30** Max level: 10 (for MVP scope).

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NF-01 | Performance | AI response delivered within 3 seconds p95 at Cloudflare edge |
| NF-02 | Scalability | Cloudflare Workers scale to zero cost at idle; burst to 10,000 req/sec |
| NF-03 | Security | Player input sanitized; system prompt never exposed to client; no SQL injection via D1 prepared statements |
| NF-04 | Accessibility | Angular Material components; WCAG 2.1 AA; keyboard navigable |
| NF-05 | Mobile | Responsive Angular layout; playable on 375px+ viewport |
| NF-06 | Offline | No offline mode in MVP; graceful error state when Worker unreachable |
| NF-07 | Cost | Worker AI inference via Cloudflare AI Gateway with caching; KV reads free tier sufficient for MVP |
| NF-08 | Privacy | No PII collected beyond username; no account system in MVP (localStorage session token) |

---

## 6. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge                         │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  Cloudflare       │    │    Cloudflare Worker         │  │
│  │  Pages            │───▶│    (game-api)                │  │
│  │  (Angular SPA)    │    │                              │  │
│  └──────────────────┘    │  Routes:                     │  │
│                           │  POST /api/action            │  │
│                           │  POST /api/character/create  │  │
│                           │  GET  /api/character/:id     │  │
│                           │  POST /api/combat/resolve    │  │
│                           │  GET  /api/session/:id       │  │
│                           │  GET  /api/log/:sessionId    │  │
│                           │  POST /api/shop/transaction  │  │
│                           └──────┬───────┬──────────────┘  │
│                                  │       │                  │
│              ┌───────────────────┘       └──────────┐      │
│              ▼                                       ▼      │
│  ┌───────────────────────┐          ┌─────────────────────┐│
│  │  Cloudflare Workers   │          │  Cloudflare D1      ││
│  │  KV                   │          │  (SQLite)           ││
│  │                       │          │                     ││
│  │  session:{id}         │          │  characters         ││
│  │  ├─ location          │          │  character_inventory││
│  │  ├─ activeQuest       │          │  adventure_log      ││
│  │  ├─ history[20]       │          │  monsters           ││
│  │  └─ combatState       │          │  items              ││
│  └───────────────────────┘          │  loot_tables        ││
│                                     │  quests             ││
│              ┌──────────────────────┤  shops              ││
│              ▼                      └─────────────────────┘│
│  ┌───────────────────────┐                                  │
│  │  Cloudflare Worker AI │                                  │
│  │                       │                                  │
│  │  @cf/meta/llama-3.1-  │                                  │
│  │    8b-instruct        │                                  │
│  │  (AI DM inference)    │                                  │
│  └───────────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

### 6.1 Worker Responsibilities

The single `game-api` Worker handles all backend logic:

1. **Route dispatch** — Hono.js router (lightweight, edge-first).
2. **Prompt engineering** — Builds structured DM prompts with game context from KV + character state from D1.
3. **Worker AI inference** — Calls `env.AI.run()` with the constructed prompt; parses JSON response.
4. **Rule enforcement** — Dice rolls, combat resolution, XP/loot calculation run in Worker code (not delegated to AI).
5. **State mutation** — Writes updated character state to D1; updates session context in KV.
6. **Response assembly** — Returns clean API response to Angular frontend.

### 6.2 Angular Frontend

- **Angular 18 LTS** with Angular Material
- **Hash-based routing** (`#/`) for Cloudflare Pages compatibility
- **Modules / Standalone components**:
  - `CharacterCreationComponent` — multi-step form
  - `GameConsoleComponent` — main play area (narrative output + input)
  - `CharacterSheetComponent` — sidebar with stats, HP bar, XP
  - `InventoryComponent` — grid view with equip/use/drop
  - `CombatOverlayComponent` — combat mode panel with action buttons
  - `AdventureLogComponent` — scrollable history panel
  - `ShopComponent` — buy/sell dialog
- **Services**:
  - `GameApiService` — HTTP client wrapper for Worker endpoints
  - `CharacterStateService` — BehaviorSubject-driven character state
  - `SessionService` — localStorage session token management
  - `CombatService` — combat state machine

---

## 7. Data Model

### D1 Schema (SQLite)

```sql
-- Characters
CREATE TABLE characters (
  id TEXT PRIMARY KEY,          -- UUID
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  race TEXT NOT NULL,
  class TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  ac INTEGER NOT NULL,
  gold INTEGER DEFAULT 50,
  str INTEGER, dex INTEGER, con INTEGER,
  int INTEGER, wis INTEGER, cha INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Inventory
CREATE TABLE character_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id TEXT REFERENCES characters(id),
  item_id INTEGER REFERENCES items(id),
  quantity INTEGER DEFAULT 1,
  equipped INTEGER DEFAULT 0
);

-- Items
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,          -- weapon, armor, potion, misc
  effect TEXT,        -- JSON: {damage, ac_bonus, heal, etc}
  value INTEGER,      -- gold pieces
  weight REAL
);

-- Monsters
CREATE TABLE monsters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cr REAL,
  hp INTEGER, max_hp INTEGER,
  ac INTEGER,
  attack_bonus INTEGER,
  damage_dice TEXT,   -- e.g. "2d6+3"
  xp_reward INTEGER,
  loot_table_id INTEGER
);

-- Loot Tables
CREATE TABLE loot_tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monster_id INTEGER,
  item_id INTEGER,
  drop_chance REAL    -- 0.0 to 1.0
);

-- Adventure Log
CREATE TABLE adventure_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  actor TEXT NOT NULL,  -- 'player' | 'dm'
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Quests
CREATE TABLE quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  level_min INTEGER DEFAULT 1,
  level_max INTEGER DEFAULT 10,
  xp_reward INTEGER,
  gold_reward INTEGER
);

-- Shops
CREATE TABLE shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT
);

CREATE TABLE shop_inventory (
  shop_id INTEGER REFERENCES shops(id),
  item_id INTEGER REFERENCES items(id),
  stock INTEGER DEFAULT -1  -- -1 = unlimited
);
```

### KV Schema

```
Key: session:{sessionId}
TTL: 7 days
Value (JSON):
{
  "characterId": "uuid",
  "location": "The Whispering Woods",
  "activeQuestId": 3,
  "activeQuestSummary": "Retrieve the stolen amulet from the goblin camp.",
  "inCombat": false,
  "combatState": null,
  "history": [
    { "role": "player", "content": "I search the room for hidden doors." },
    { "role": "dm", "content": "Your fingers trace the cold stone..." }
  ]
}
```

---

## 8. AI Prompt Engineering

### 8.1 System Prompt

```
You are an expert, creative, and fair Dungeon Master for a D&D 5e-inspired text adventure game.
Your role is to:
- Describe vivid, immersive scenes that react meaningfully to the player's choices.
- Drive the story forward with tension, mystery, humor, and consequence.
- Enforce D&D 5e-inspired rules fairly — tell the player when dice rolls matter and narrate the result.
- Keep combat exciting but mechanically grounded.
- Never break character. Never acknowledge being an AI.
- Always return ONLY valid JSON matching the provided schema. No markdown, no extra text.
```

### 8.2 User Turn Template

```
GAME STATE:
- Character: {name}, Level {level} {race} {class}
- HP: {hp}/{max_hp} | AC: {ac} | Gold: {gold}g
- Location: {location}
- Active Quest: {activeQuestSummary}

RECENT HISTORY (last 10 turns):
{history}

PLAYER ACTION:
"{playerInput}"

Respond with JSON matching this schema exactly:
{schema}
```

### 8.3 Combat Prompt Addendum

When `inCombat: true`, the system prompt is extended with:

```
COMBAT STATE:
- Enemy: {enemyName} | HP: {enemyHp}/{enemyMaxHp} | AC: {enemyAc}
- Round: {round}

The Worker has already resolved attack/damage rolls mechanically.
Apply these results to your narrative:
- Player attack result: {playerRoll} vs AC {enemyAc} → {hit/miss}
- Player damage: {damage}
- Enemy attack result: {enemyRoll} vs AC {playerAc} → {hit/miss}  
- Enemy damage: {enemyDamage}

Narrate the round vividly. Do not re-roll or contradict these numbers.
```

---

## 9. API Specification

### POST `/api/character/create`
**Body:** `{ name, race, class, abilityRollMethod }`  
**Response:** `{ characterId, sessionId, character: {...}, startNarrative }`

### POST `/api/action`
**Body:** `{ sessionId, characterId, action: string }`  
**Response:** `{ narrative, gameStateChanges, suggestedActions, diceRolls, updatedCharacter }`

### POST `/api/combat/resolve`
**Body:** `{ sessionId, characterId, action: "attack"|"dodge"|"flee"|"use_item", itemId? }`  
**Response:** `{ narrative, combatState, updatedCharacter, combatEnded, victory }`

### GET `/api/character/:id`
**Response:** `{ character, inventory, activeQuest }`

### GET `/api/session/:id`
**Response:** `{ session (KV state) }`

### GET `/api/log/:sessionId?page=0&limit=20`
**Response:** `{ entries: [...], total, page }`

### POST `/api/shop/transaction`
**Body:** `{ sessionId, characterId, shopId, action: "buy"|"sell", itemId, quantity }`  
**Response:** `{ success, updatedGold, updatedInventory }`

### POST `/api/levelup`
**Body:** `{ sessionId, characterId, abilityChoice }`  
**Response:** `{ narrative, updatedCharacter }`

---

## 10. UI/UX Requirements

### Main Game Console

```
┌────────────────────────────────────────────────┬──────────────┐
│ [Character Sheet Sidebar]                      │ [Adventure   │
│ Name | Class | Level                           │  Log Panel]  │
│ ████████░░░░ HP 28/40                         │              │
│ AC: 15  XP: 1240/2700  Gold: 83g              │              │
├────────────────────────────────────────────────┤              │
│                                                │              │
│  NARRATIVE OUTPUT AREA                         │              │
│  (scrollable, monospace/serif font,            │              │
│   parchment-textured background)               │              │
│                                                │              │
│  [Quick Action Chips]                          │              │
│  [Look around] [Search] [Talk to innkeeper]    │              │
│                                                │              │
├────────────────────────────────────────────────┤              │
│  > Type your action...                [Send]   │              │
└────────────────────────────────────────────────┴──────────────┘
```

### Combat Mode (Overlay)

- Red border on game console
- Enemy HP bar visible
- Action buttons: **Attack**, **Dodge**, **Use Item**, **Flee**
- Dice roll animations on attack resolution
- Turn indicator ("Your turn" / "Enemy is acting…")

### Theme

- Dark fantasy aesthetic: deep purples, aged gold, dark stone textures
- Angular Material `dark` theme with custom D&D palette
- Serif font for narrative (e.g., Cinzel or Crimson Text from Google Fonts)
- Monospace for dice rolls / stats

---

## 11. Phased Delivery Plan

### Phase 1 — Foundation (MVP Core)
- [ ] Cloudflare Worker scaffold (Hono router, D1 binding, KV binding, AI binding)
- [ ] D1 schema migration + seed data (items, monsters, loot_tables, 3 starting quests)
- [ ] Character creation endpoint + Angular creation flow
- [ ] Core `POST /api/action` endpoint with Worker AI DM
- [ ] Game console Angular component (input → narrative display)
- [ ] Session persistence (KV read/write on each action)
- [ ] Character state sidebar

### Phase 2 — Combat & Progression
- [ ] Combat resolution engine (server-side dice, monster stats from D1)
- [ ] `POST /api/combat/resolve` endpoint
- [ ] Combat mode UI overlay
- [ ] XP / level-up system + `POST /api/levelup`
- [ ] Adventure log (D1 writes + GET endpoint + UI panel)

### Phase 3 — World & Economy
- [ ] Shop system (D1 shops + transaction endpoint)
- [ ] Inventory management UI
- [ ] Multiple starting locations / quest variety
- [ ] AI-generated backstory on character creation

### Phase 4 — Polish & Deploy
- [ ] Cloudflare Pages deployment (CI/CD via GitHub Actions)
- [ ] Error states, loading skeletons, offline handling
- [ ] Accessibility pass (WCAG 2.1 AA)
- [ ] Performance profiling (AI response latency, D1 query optimization)
- [ ] AI response caching via Cloudflare AI Gateway

---

## 12. Out of Scope (MVP)

- Multiplayer / co-op
- User accounts / authentication (localStorage token only)
- Voice narration
- AI-generated images (future: Worker AI image models)
- Save slots (one active campaign per browser session)
- Custom dungeon builder / DM tools
- Mobile app (web only)

---

## 13. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Worker AI response too slow (>3s) | Medium | AI Gateway caching; streaming responses (future) |
| AI returns malformed JSON | Medium | Server-side schema validation; retry with stricter prompt; fallback narrative |
| AI breaks DM persona / generates inappropriate content | Low–Medium | System prompt hardening; output moderation filter |
| D1 write latency spikes | Low | KV for hot path (session state); D1 only for durable writes |
| KV TTL expires mid-campaign | Low | Refresh TTL on every action; rebuild context from D1 log if needed |
| Cost overrun on Worker AI | Low | AI Gateway rate limiting; token budget in prompt (max_tokens) |

---

## 14. Open Questions

1. Should we support multiple save slots per browser (requires simple account concept)?
2. Should the AI DM narrate dice rolls poetically, or should dice results appear as raw UI elements?
3. What content rating to target — family-friendly, teen, or mature fantasy?
4. Should the AI generate quest content dynamically, or should quests be seeded in D1 with AI adding flavor?

---

*End of Document*
