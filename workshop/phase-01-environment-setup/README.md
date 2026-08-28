# Phase 1 · Environment & Project Setup

**Duration:** 10 minutes

## Learning Objectives

- Provision the Cloudflare resources (D1 database, Workers KV namespace) the rest of the workshop builds on.
- Understand the two-project layout — a Cloudflare Worker backend and an Angular 18 SPA frontend — and why they're separate npm projects.
- Get a Hono-based Worker running locally and responding to a health check.
- Get a blank Angular 18 standalone app running locally with Angular Material wired in.
- Recognize the CORS and hash-routing gotchas that Cloudflare Pages + Workers introduce, before they bite you later.

## Prerequisites

A blank folder. Nothing has been built yet — this phase creates the skeleton every later phase fills in.

## Concepts

**Why two separate projects?** The architecture (PRD.md section 6) is a single Cloudflare Worker (`game-api`) handling all backend logic — routing, AI prompt construction, dice/combat rules, D1/KV reads and writes — fronted by an Angular SPA deployed to Cloudflare Pages. They deploy independently, so they live in separate `worker/` and `frontend/` folders with their own `package.json`, each with its own toolchain (Wrangler for the Worker, Angular CLI for the frontend).

**Why D1 and KV, and why now?** PRD.md section 4.5 splits persistence in two: Workers KV holds ephemeral, fast-changing session context (current location, active quest, last-20-turns history) with a 7-day TTL, while D1 (SQLite at the edge) holds the durable character record, inventory, and adventure log forever. You provision both now because their resource IDs have to go into `wrangler.toml` before the Worker will boot — even though you won't read or write to either until Phase 2 (D1 schema) and Phase 3 (routes that touch KV).

**Why Hono?** It's a lightweight, edge-first router with first-class Cloudflare Workers support — no Node.js APIs to polyfill, tiny cold-start footprint. You'll see it again in every backend phase.

**Why hash routing?** Cloudflare Pages serves a static SPA; without a catch-all rewrite, a hard refresh on `/game/abc123` 404s because there's no such file on disk. Hash routing (`/#/game/abc123`) keeps the actual URL fragment client-side, so Pages only ever needs to serve `index.html`. This is a global project preference, and `app.config.ts` already wires it up via `withHashLocation()`.

**Why is `worker/src/index.ts` almost empty?** This phase's Worker only exposes `/api/health`. All eight real routes (character, action, combat, session, log, shop, levelup, quest — see PRD.md section 6 architecture diagram) get mounted starting in Phase 3, once there's a database and AI DM service behind them. Building an empty-but-running skeleton first means you can verify your Cloudflare wiring in isolation, before any game logic is in play.

## Step-by-Step

This phase is almost entirely CLI commands — there's no code to write yet, just resources to provision and scaffold files to drop in place (already done for you in `starter/`, which is identical to `solution/` for this phase only).

### 1. Install prerequisites

- Node.js 18 or later (`node -v` to check).
- A Cloudflare account with Workers AI access enabled (free tier is fine).
- The Wrangler CLI, installed globally:
  ```bash
  npm install -g wrangler
  ```

### 2. Authenticate Wrangler

```bash
wrangler login
```
This opens a browser window to authorize the CLI against your Cloudflare account. You should see `Successfully logged in.` when it completes.

### 3. Create the D1 database

```bash
wrangler d1 create ai-dnd-db
```
Expected output includes a TOML snippet with a `database_id` — a UUID like `3abe5394-613c-4610-a743-94bddc2de838`. Copy it; you'll paste it into `wrangler.toml` in step 6.

### 4. Create the Workers KV namespace (production + preview)

```bash
wrangler kv:namespace create SESSION_KV
wrangler kv:namespace create SESSION_KV --preview
```
Each command prints an `id` (the second prints a `preview_id`). Copy both.

### 5. Scaffold the project folders

```bash
mkdir my-ai-dnd && cd my-ai-dnd
mkdir worker frontend
```

### 6. Populate the baseline files

Copy every file from this phase's `starter/` folder into your `my-ai-dnd/` folder, preserving the `worker/...` and `frontend/...` paths. Then open `worker/wrangler.toml` and replace the three placeholder comments with the real IDs from steps 3–4:

```toml
[[kv_namespaces]]
binding = "SESSION_KV"
id = ""          # <-- paste your `wrangler kv:namespace create SESSION_KV` id here
preview_id = ""  # <-- paste your `wrangler kv:namespace create SESSION_KV --preview` preview_id here

[[d1_databases]]
binding = "DB"
database_name = "ai-dnd-db"
database_id = "" # <-- paste your `wrangler d1 create ai-dnd-db` database_id here
```

A quick tour of what you just copied in, and why each file exists:

- **`.gitignore` / `.gitattributes`** — standard Node/Angular/Wrangler ignores (`node_modules`, `dist`, `.wrangler`, `.angular`) and LF normalization.
- **`worker/package.json`** — declares `hono` as the only runtime dependency, plus `wrangler`, `typescript`, and `@cloudflare/workers-types` as dev dependencies, and npm scripts for `dev`, `deploy`, and the D1 migrate/seed commands you'll use starting in Phase 2.
- **`worker/tsconfig.json`** — targets `ES2022`, uses `@cloudflare/workers-types` for `Ai`/`D1Database`/`KVNamespace` typings, and sets `rootDir`/`outDir` explicitly (required by TS 6+ per this project's Angular/TS conventions, and good hygiene for any edge Worker build).
- **`worker/wrangler.toml`** — the Worker's Cloudflare config: bindings for `AI`, `SESSION_KV`, and `DB`, plus an `ENVIRONMENT` var.
- **`worker/src/index.ts`** — a minimal Hono app: the `logger` and `cors` middleware (copy the CORS block verbatim — more on it below) and a single `GET /api/health` route. Everything else is a comment placeholder for Phase 3.
- **`frontend/package.json`, `angular.json`, `tsconfig*.json`** — a standard Angular 18 standalone-app setup with Angular Material and SCSS as the default component style.
- **`frontend/public/_routes.json`** — tells Cloudflare Pages to serve the SPA for every path except `/api/*`, so Pages doesn't intercept calls meant for the Worker.
- **`frontend/src/environments/*.ts`** — `apiUrl` pointing at `localhost:8787` in dev, and a placeholder `workers.dev` URL in prod (you'll update this after deploying the Worker, in the last phase).
- **`frontend/src/main.ts`, `index.html`, `app/app.component.ts`, `app/app.config.ts`** — the standalone bootstrap: `provideRouter(routes, withHashLocation())`, `provideHttpClient(withFetch())`, and `provideAnimationsAsync()` for Material.
- **`frontend/src/app/app.routes.ts`** — empty `routes: Routes = []` for now; real routes (login, character creation, game console) arrive in Phase 5.
- **`frontend/src/styles.scss`** — just `@include mat.core()` plus a minimal reset. The full dark-fantasy theme (custom palette, fonts, HP bars, narrative panels) is Phase 6's deliverable — don't build it early.

### 7. The CORS gotcha (read this now, thank yourself later)

Open `worker/src/index.ts` and look at the `cors()` middleware:

```ts
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return null;
    if (
      origin === 'http://localhost:4200' ||
      origin.endsWith('.pages.dev') ||
      origin.endsWith('.workers.dev')
    ) {
      return origin;
    }
    return null;
  },
  ...
}));
```
Hono's `cors()` treats an `origin` array as a list of *exact* string matches — it does **not** support wildcard patterns like `*.pages.dev`. Since Cloudflare Pages preview deployments get a new random subdomain every time (`https://abc123.my-ai-dnd.pages.dev`), an exact-match array would silently break CORS on every preview URL. Using a function instead lets you match by suffix. This is already correct in the starter — just don't "simplify" it to an array later.

## Code Walkthrough (solution)

There's no starter/solution split for this phase — the files above **are** the solution. The only thing worth re-emphasizing: `worker/src/index.ts` defines its own minimal local `Env` type (`{ ENVIRONMENT?: string }`) rather than importing one. The real `Env` interface — with `AI`, `SESSION_KV`, and `DB` bindings — doesn't exist until Phase 2's `worker/src/types/index.ts`, so this phase's Worker deliberately doesn't depend on it yet.

## Checkpoint

**Worker:**
```bash
cd worker
npm install
npm run dev
```
Wrangler should print something like `Ready on http://localhost:8787`. In another terminal:
```bash
curl http://localhost:8787/api/health
```
Expect:
```json
{"status":"ok","timestamp":"2026-08-28T12:00:00.000Z"}
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```
Open `http://localhost:4200` — you should see a blank white page (there's no content yet, just the empty `<router-outlet>`) with no errors in the browser console.

## Common Pitfalls

- **Forgetting to replace the `wrangler.toml` placeholders.** If you skip step 6, `wrangler dev` will either fail to start or bind to the wrong resources. Double-check `id`, `preview_id`, and `database_id` are all filled in with real UUIDs, not left as empty strings.
- **Running `npm install` from the repo root instead of `worker/`/`frontend/`.** These are two independent npm projects — there is no root `package.json`. Always `cd` into the right folder first.
- **`wrangler login` opening a browser you can't see (headless/CI/SSH).** Use `wrangler login` from a machine with a browser, or fall back to an API token via `CLOUDFLARE_API_TOKEN`.
- **Simplifying the CORS `origin` function to an array.** As noted above, this breaks on Pages preview subdomains — a fresh one is generated per deploy, so any hardcoded array goes stale immediately.
- **Confusing `kv:namespace create` (production) with `--preview`.** You need both IDs — `wrangler dev` uses the preview namespace locally, while a deployed Worker uses the production one. Missing either will cause KV reads/writes to silently no-op or error once you reach Phase 3+.

## Next

[Phase 2 · Data Layer](../phase-02-data-layer/README.md)
