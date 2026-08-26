# AI Dungeon — Setup Guide

## Prerequisites

- Node.js 18+
- Cloudflare account with Workers AI access
- Wrangler CLI: `npm install -g wrangler`

---

## 1. Cloudflare Resource Setup

### 1a. Authenticate Wrangler
```bash
wrangler login
```

### 1b. Create D1 Database
```bash
cd worker
wrangler d1 create ai-dnd-db
```
Copy the `database_id` into `wrangler.toml` under `[[d1_databases]]`.

### 1c. Create Workers KV Namespace
```bash
wrangler kv:namespace create SESSION_KV
wrangler kv:namespace create SESSION_KV --preview
```
Copy both IDs into `wrangler.toml` under `[[kv_namespaces]]`.

### 1d. Run Database Migrations
```bash
# Local dev
npm run db:migrate:local
npm run db:seed:local

# Production
npm run db:migrate
npm run db:seed
```

---

## 2. Worker Development

```bash
cd worker
npm install
npm run dev
```
Worker runs at `http://localhost:8787`.

Health check: `curl http://localhost:8787/api/health`

---

## 3. Frontend Development

```bash
cd frontend
npm install
npm start
```
Angular dev server at `http://localhost:4200`.

The frontend auto-detects localhost and calls `http://localhost:8787` for the API.

---

## 4. Production Deployment

### Deploy Worker
```bash
cd worker
npm run deploy
```
Note the Worker URL (e.g. `https://ai-dnd-worker.YOUR-SUBDOMAIN.workers.dev`).

### Deploy Frontend to Cloudflare Pages
```bash
cd frontend
npm run build:prod
```
Then in the Cloudflare Dashboard:
1. Pages → Create project → Connect Git (or upload `dist/frontend/browser`)
2. Build command: `npm run build:prod`
3. Build output directory: `dist/frontend/browser`
4. Add environment variable: (none needed — same-origin proxying)

**Configure the Pages → Worker proxy:**
In your Pages project settings → Functions → Service bindings:
- Bind `/api/*` → your `ai-dnd-worker`

Or use `wrangler pages deploy`:
```bash
wrangler pages deploy dist/frontend/browser --project-name ai-dnd
```

---

## 5. Worker AI Models Used

| Model | Purpose |
|---|---|
| `@cf/meta/llama-3.1-8b-instruct` | Primary DM narrative |
| `@cf/mistral/mistral-7b-instruct-v0.1` | Fallback DM |

Both are included in the Cloudflare Workers AI free tier.

---

## 6. Project Structure

```
ai-dnd/
├── PRD.md                     Product requirements
├── SETUP.md                   This file
├── worker/                    Cloudflare Worker (backend)
│   ├── src/
│   │   ├── index.ts           Hono router entry point
│   │   ├── routes/            Route handlers (character, action, combat…)
│   │   ├── services/          AI DM, dice engine, combat resolver
│   │   ├── db/seed.sql        D1 seed data
│   │   └── types/             Shared TypeScript types
│   ├── migrations/            D1 schema migrations
│   └── wrangler.toml          Cloudflare config (fill in your IDs)
└── frontend/                  Angular 18 SPA
    ├── src/
    │   ├── app/
    │   │   ├── components/    LoginComponent, CharacterCreation, GameConsole…
    │   │   ├── services/      GameApiService, CharacterStateService, AuthService
    │   │   └── models/        game.models.ts (shared types)
    │   └── styles.scss        D&D dark theme + Angular Material overrides
    └── public/_routes.json    Cloudflare Pages routing
```
