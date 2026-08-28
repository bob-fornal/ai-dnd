# Phase 9 · Deploy & Wrap-up

**Duration:** 15 minutes (plus a 20-minute buffer/Q&A block after)

## Learning Objectives

- Deploy the Worker and the Angular app to Cloudflare for real.
- Recognize the handful of issues that actually broke this exact app in production — and how each was fixed — so you don't lose an afternoon to them yourself.
- Know where to go next: the PRD's open questions and out-of-scope list.

## Prerequisites

Everything through [Phase 8](../phase-08-economy-world/README.md) complete. Your project should now match [`complete-reference/`](../complete-reference/) file-for-file.

## Step-by-Step: Deploying from scratch

### 1. Deploy the Worker

```bash
cd worker
npx wrangler deploy
```

Note the Worker URL it prints (e.g. `https://ai-dnd-worker.YOUR-SUBDOMAIN.workers.dev`).

### 2. Apply the schema and seed data to the *production* D1 database

Local `wrangler dev` uses a separate SQLite file under `.wrangler/state/` — it has no idea about your production database. Run these once, explicitly, against `--remote`:

```bash
npx wrangler d1 migrations apply ai-dnd-db --remote
npx wrangler d1 execute ai-dnd-db --remote --file=src/db/seed.sql
```

Skip this and character creation returns a 500 — there are no tables yet.

### 3. Point the frontend at the deployed Worker

Angular environment files are swapped **at compile time**, not read at runtime — there is no `process.env` in the browser. Confirm `frontend/src/environments/environment.prod.ts` has your real Worker URL:

```typescript
export const environment = { production: true, apiUrl: 'https://ai-dnd-worker.YOUR-SUBDOMAIN.workers.dev' };
```

### 4. Build and deploy the frontend to Cloudflare Pages

```bash
cd frontend
npm run build:prod
```

Then either connect the Pages project to your Git repo (native CI: build command `npm run build:prod`, output directory `dist/frontend/browser`, no environment variables needed), or deploy directly:

```bash
wrangler pages deploy dist/frontend/browser --project-name ai-dnd
```

### Deployment checklist

- [ ] `cd worker && npx wrangler deploy`
- [ ] `npx wrangler d1 migrations apply ai-dnd-db --remote`
- [ ] `npx wrangler d1 execute ai-dnd-db --remote --file=src/db/seed.sql`
- [ ] `frontend/src/environments/environment.prod.ts` has the correct Worker URL
- [ ] `cd frontend && npm run build:prod`
- [ ] Push to the branch connected to Cloudflare Pages (native CI deploys automatically), or `wrangler pages deploy`

## Real gotchas we hit shipping this exact app

Every one of these came from an actual failed deploy. Full detail lives in [`docs/DEPLOYMENT_NOTES.md`](../complete-reference/docs/DEPLOYMENT_NOTES.md) — this is the highlight reel.

**1. Missing `build:prod` script.** The default Angular CLI scaffold has no production build command. Add it yourself:
```json
"build:prod": "ng build --configuration production"
```

**2. CSS budget exceeded.** Angular's default `anyComponentStyle` budget (2 kB warning / 4 kB error) is too tight for a themed component like the game console. We doubled it in `angular.json`:
```json
{ "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
```

**3. `process.env` doesn't exist in the browser.** If you ever see a Worker URL resolve to `undefined` and every API call 404 against the Pages domain, someone tried to read a runtime env var in browser code. Angular's `fileReplacements` (see Step 3 above) is the only correct fix — there's no compile-time-free alternative for a static Pages deploy.

**4. `wrangler deploy` vs. `wrangler pages deploy`.** They deploy to two different products. `wrangler deploy dist/frontend/browser` tries to push your build output as a *Worker script* and fails confusingly. Static frontends go through `wrangler pages deploy`.

**5. `_routes.json` without Pages Functions.** `frontend/public/_routes.json` is only valid when the project also has Pages Functions. Without them, Cloudflare rejects the whole deployment. Delete it before a Pages-only deploy.

**6. CORS wildcard subdomains never match as literal strings.** Hono's `cors()` middleware treats every entry in an `origin` array as an exact string — `'https://*.workers.dev'` matches nothing, ever, and the Pages URL has two subdomain levels so even a prefix check fails. The fix, already in your `index.ts` since Phase 3, is a function:
```typescript
origin: (origin) => {
  if (!origin) return null;
  if (origin === 'http://localhost:4200' || origin.endsWith('.pages.dev') || origin.endsWith('.workers.dev')) {
    return origin;
  }
  return null;
}
```

**7. D1 tables missing on first deploy.** Covered in Step 2 above — it's easy to deploy the Worker, load the app, and get a confusing 500 because migrations were never applied to the *remote* database.

**8. AI model deprecation, silently.** `@cf/meta/llama-3.1-8b-instruct` was deprecated mid-project. Every AI call silently fell back to the canned narrative — no crash, no obvious error, just a suspiciously generic story. Worker logs (`npx wrangler tail ai-dnd-worker`) showed the real error. **Lesson: when Workers AI output looks "off," always check `wrangler tail` before assuming your prompt is wrong** — a deprecated/renamed model is a much more common culprit than bad prompt engineering.

**9. Response-shape drift between models.** The replacement model (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) returns an OpenAI-style `choices[0].message.content` object instead of the legacy `{ response: string }` shape. `ai-dm.ts`'s dual-format extraction (built in Phase 4) exists specifically to survive this kind of change without a code deploy every time Cloudflare updates a model.

**10. `wrangler dev` (local) stubs the AI binding.** Local dev returns empty objects for any `env.AI.run()` call — it is not a bug in your code. Use `wrangler dev --remote` (if your plan supports it) or deploy and `wrangler tail` to test real AI responses.

## Checkpoint

- `curl https://<your-worker>.workers.dev/api/health` → `{"status":"ok",...}`
- Load the deployed Pages URL, create a character, take an action, and confirm you get a real AI-narrated response (not the fallback narrative).
- `npx wrangler tail ai-dnd-worker` while you play, to see requests flow through live.

## Open questions (from the PRD) — good discussion for the buffer block

1. Should we support multiple save slots per browser (requires a lightweight account concept)?
2. Should the AI DM narrate dice rolls poetically, or should raw dice results appear as UI elements?
3. What content rating should we target — family-friendly, teen, or mature fantasy?
4. Should the AI generate quest content dynamically, or should quests stay seeded in D1 with the AI only adding flavor?

## Out of scope today (and for the MVP)

Multiplayer/co-op, real user accounts, voice narration, AI-generated images, multiple save slots, a custom dungeon builder, and a native mobile app. All good "what would Phase 10 look like" conversation starters.

## Where to go from here

- Re-read [`PRD.md`](../complete-reference/PRD.md) section 13 (Risks & Mitigations) now that you've built the thing it's describing — it'll read completely differently.
- Try swapping the primary Workers AI model and see how much of `ai-dm.ts`'s defensive parsing (Phase 4) you actually needed.
- Pick one open question above and prototype it.

Thanks for building AI Dungeon with us today.
