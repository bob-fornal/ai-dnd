# AI D&D — Deployment Notes

A record of production deployment issues encountered and resolved when shipping this project to Cloudflare Workers + Pages.

---

## 1. Frontend Build

### Missing `build:prod` script
`frontend/package.json` had no production build command.

**Fix:** Added to `scripts`:
```json
"build:prod": "ng build --configuration production"
```

### CSS budget exceeded
Angular component styles were hitting the default `anyComponentStyle` budget limits and blocking the build.

**Fix:** Doubled the limits in `frontend/angular.json`:
```json
{ "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
```

---

## 2. API URL Injection

### `process.env` not available in the browser
The original code used `(globalThis as any)['process']?.env?.['NG_APP_API_URL']` to inject the Worker URL at runtime. This bypasses esbuild's compile-time substitution and always evaluates to `undefined` in the browser, causing every API call to hit a relative path on the Pages domain (404).

**Fix:** Use Angular environment files instead — they are swapped at compile time via `fileReplacements` in `angular.json` with no runtime dependency.

`frontend/src/environments/environment.ts` (dev):
```typescript
export const environment = { production: false, apiUrl: 'http://localhost:8787' };
```

`frontend/src/environments/environment.prod.ts` (production):
```typescript
export const environment = { production: true, apiUrl: 'https://ai-dnd-worker.ai-dnd.workers.dev' };
```

`frontend/src/app/services/game-api.service.ts`:
```typescript
import { environment } from '../../environments/environment';
const API_BASE: string = environment.apiUrl;
```

`frontend/angular.json` — under `configurations.production`:
```json
"fileReplacements": [
  { "replace": "src/environments/environment.ts", "with": "src/environments/environment.prod.ts" }
]
```

> **Note:** Cloudflare Pages blocks adding runtime environment variables to a Worker that only serves static assets ("Variables cannot be added to a Worker that only has static assets"). The compile-time approach avoids this entirely.

---

## 3. Cloudflare Pages Deployment

### Wrong deploy command
Using `wrangler deploy dist/frontend/browser` tries to deploy a Worker script, not a Pages project.

**Fix:** Use `wrangler pages deploy`, or better, let Cloudflare Pages native CI handle it automatically. In the Pages dashboard, set:
- **Build command:** `npm run build:prod`
- **Build output directory:** `dist/frontend/browser`

No custom deploy command or `CLOUDFLARE_API_TOKEN` is needed for Pages native CI.

### `_routes.json` not supported
A `_routes.json` file in `public/` is only valid when Pages Functions are present. Without them Cloudflare rejects the deployment.

**Fix:** Delete `frontend/public/_routes.json`.

### `frontend/wrangler.toml`
Required if deploying Pages manually via CLI (not needed for native CI):
```toml
name = "ai-dnd"
compatibility_date = "2026-08-25"
pages_build_output_dir = "dist/frontend/browser"
```

---

## 4. CORS

### Wildcard subdomain matching
Hono's `cors()` middleware treats every entry in a string array as a literal string — `'https://*.workers.dev'` will never match. The Pages project URL (`https://ai-dnd-frontend.ai-dnd.workers.dev`) has two subdomain levels, so a simple prefix check also fails.

**Fix:** Pass `origin` as a function in `worker/src/index.ts`:
```typescript
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
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
```

---

## 5. D1 Database

### Tables missing / empty on first deploy
Character creation returns 500 because the D1 database has no tables or seed data. Migrations and seed must be applied explicitly to the production database.

**Fix — run once after initial deploy:**
```bash
# Apply schema migration
npx wrangler d1 migrations apply ai-dnd-db --remote

# Seed reference data (items, monsters, quests, shops)
npx wrangler d1 execute ai-dnd-db --remote --file=src/db/seed.sql
```

---

## 6. Workers AI — Model Deprecation

### `@cf/meta/llama-3.1-8b-instruct` deprecated 2026-05-30
All AI calls silently failed and returned the fallback narrative because the primary model was deprecated. The error in Worker logs:
```
AiError: 5028: @cf/meta/llama-3.1-8b-instruct was deprecated on 2026-05-30.
```

**Fix:** Updated model names in `worker/src/services/ai-dm.ts`:

| Role | Old model | New model |
|---|---|---|
| Primary | `@cf/meta/llama-3.1-8b-instruct` | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| Fallback | `@cf/mistral/mistral-7b-instruct-v0.1` | `@cf/mistral/mistral-7b-instruct-v0.2-lora` |

### `llama-3.3-70b` returns OpenAI-compatible response format
The new model returns an OpenAI-style response object (`choices[0].message.content`) rather than the legacy `{ response: string }` shape. The original extraction code produced an empty string.

**Fix:** Updated response extraction in `askDM()`:
```typescript
// llama-3.3-70b returns OpenAI-compatible format
const choicesContent = (response as any)?.choices?.[0]?.message?.content;
const legacyContent  = (response as any)?.response;
rawText = typeof choicesContent === 'string' && choicesContent.length > 0 ? choicesContent
        : typeof legacyContent   === 'string' && legacyContent.length  > 0 ? legacyContent
        : typeof response === 'string' ? response
        : '';
```

The same dual-format extraction was applied to the mistral fallback path.

### `response_format: { type: 'json_object' }` and JSON parsing
Added to the primary AI call to encourage structured output. `parseAIResponse()` was also hardened:
- Strips markdown fences (` ```json … ``` `)
- Falls back to regex extraction (`/\{[\s\S]*\}/`) if the model emits explanation text before or after the JSON object
- Returns a graceful `fallbackNarrative()` if parsing still fails

---

## 7. Local Development Notes

- `wrangler dev` (local mode) stubs Workers AI bindings and returns empty objects — AI calls will not work locally without `--remote`.
- `wrangler dev --remote` requires a Cloudflare account plan that supports remote preview sessions. If unavailable, deploy to production and tail logs instead:
  ```bash
  npx wrangler tail ai-dnd-worker
  ```
- D1 local mode uses a SQLite file in `.wrangler/state/` — it is separate from the production database and must be seeded independently if used.

---

## Deployment Checklist

For a clean deploy from scratch:

- [ ] `cd worker && npx wrangler deploy`
- [ ] `npx wrangler d1 migrations apply ai-dnd-db --remote`
- [ ] `npx wrangler d1 execute ai-dnd-db --remote --file=src/db/seed.sql`
- [ ] Confirm `frontend/src/environments/environment.prod.ts` has the correct Worker URL
- [ ] `cd frontend && npm run build:prod`
- [ ] Push to the repo branch connected to Cloudflare Pages (native CI triggers automatically)
