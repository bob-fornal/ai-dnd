# styles.scss

The global theme: an Angular Material M3 theme, the dark-fantasy CSS custom properties, and shared utility classes.

## Key contents
| Area | Notes |
|---|---|
| `mat.define-theme` | M3 theme applied at `:root` |
| CSS variables | `--bg-*`, `--border`, `--gold*`, `--purple*`, `--red*`, `--green*`, `--text*`, and the font vars `--narrative-font` (Crimson Text), `--title-font` (Cinzel), `--ui-font` |
| Utilities | `.title-font`, `.narrative-font`, `.hp-bar`/`.hp-fill` states, `.gold`, `.text-muted`, scrollbar styling |
| Reset | `html, body { overflow: hidden; height: 100% }`, so each layout must scroll its own panes |

## Rules
- Components use **these variables and classes** inside their own inline `styles`. Add a new color here as a variable rather than hard-coding it in a component.
- Watch the Angular CSS budget ([DEPLOYMENT_NOTES §1](../../docs/DEPLOYMENT_NOTES.md#1-frontend-build)).

## Connections
**Parents (used by):**
- Angular CLI build (`angular.json` `styles`)
- All components rely on its variables and classes: [login](app/components/login/login.component.md), [character-creation](app/components/character-creation/character-creation.component.md), [game-console](app/components/game-console/game-console.component.md), [character-sheet](app/components/character-sheet/character-sheet.component.md), [inventory](app/components/inventory/inventory.component.md)

**Children (uses):** none
- Spec: [PRD §10](../../PRD.md#10-uiux-requirements)
