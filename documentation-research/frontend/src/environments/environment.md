# environments/environment.ts (+ environment.prod.ts)

The build-time API base URL for the frontend.

| File | `apiUrl` | Used when |
|---|---|---|
| `environment.ts` | `http://localhost:8787` | `ng serve` / development builds |
| `environment.prod.ts` | Deployed `*.workers.dev` URL | `npm run build:prod` (`fileReplacements` in `angular.json`) |

## Rules
- Browser code has no `process.env`. The URL has to be baked in at build time ([DEPLOYMENT_NOTES §2](../../../docs/DEPLOYMENT_NOTES.md#2-api-url-injection)).
- Update `environment.prod.ts` whenever the Worker URL changes, and add the matching origin to CORS in [worker index.md](../../../worker/src/index.md) if needed.

## Related deployment config
- `frontend/wrangler.toml`: Pages project `ai-dnd`, output `dist/frontend/browser`. Its comment about `NG_APP_API_URL` is **out of date**; the URL comes from this file.
- `frontend/public/_routes.json`: excludes `/api/*` from the SPA. See [DEPLOYMENT_NOTES §3](../../../docs/DEPLOYMENT_NOTES.md#3-cloudflare-pages-deployment) for Pages support.

## Connections
**Parents (used by):**
- [game-api.service.md](../app/services/game-api.service.md): `API_BASE`

**Children (uses):** none
