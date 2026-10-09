# Agent Guidelines

These rules apply to every agent (and human) working in this repository: `complete/`, `workshop/` (every phase's `starter/` and `solution/`, plus `complete-reference/`), and `documentation-research/`.

## Angular: separation of concerns

Angular is **not** React. Do not write single-file components with inline `template:` and `styles:` blocks. Every component is split into four files that sit side by side in its own folder:

```
components/login/
├── login.component.ts       # class, DI, signals, behavior; no markup, no CSS
├── login.component.html     # template only
├── login.component.css      # component-scoped styles only
└── login.component.spec.ts  # unit tests (Jasmine + TestBed)
```

The `@Component` decorator points to the external files:

```ts
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [/* ... */],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent { /* ... */ }
```

### Rules

- **No inline `template:` or `styles:`**, not even for a one-line component like `AppComponent`. Use `templateUrl` and `styleUrl`.
- **Component styles are plain `.css`.** No SCSS nesting (`&:hover`, nested selectors) or SCSS-only syntax in component stylesheets. Global theming (Angular Material `mat.define-theme()`, CSS custom properties, fonts) stays in `src/styles.scss`, and components consume it through `var(--…)` custom properties.
- **Every component ships a `.spec.ts`.** At minimum it creates the component through `TestBed`, with its services stubbed or mocked (no real HTTP, no real `localStorage` dependence), and asserts that it renders. Add behavior tests for anything the component decides on its own.
- **Logic lives in services, not templates or components.** Components handle presentation state and delegate data access to `services/` (`GameApiService`, `AuthService`, `CharacterStateService`). Models and types live in `models/`.
- **Services, guards, and pipes get `.spec.ts` files too** when they're added or meaningfully changed.
- **CLI defaults match these rules.** In `angular.json`, `@schematics/angular:component` uses `"style": "css"` and does not set `skipTests`, so `ng generate component` produces all four files.
- **Prefer Angular Material** for UI, target the Angular LTS line, and use standalone components with signals.

### Workshop phases

Workshop `starter/` and `solution/` copies of a component must have the **same** `.html`, `.css`, and `.spec.ts` files. Only the `.ts` class differs: the starter has `TODO` stubs, the solution has the implementation. When a component changes in `complete/`, update every workshop copy of it (and `workshop/complete-reference/`) to match.

## Other conventions

- Cloudflare-hosted Angular uses hash routing (`withHashLocation()`, URLs like `/#/game/:id`).
- Implement in the backend (Worker) first, then the frontend, when a feature touches both. The Worker owns game rules; the AI only narrates.
- With TypeScript 6+, every tsconfig that sets `outDir` needs an explicit `rootDir`: the base `tsconfig.json` (the one editors such as VS Code check on its own) as well as `tsconfig.app.json` and `tsconfig.spec.json`. In the frontend this is `"rootDir": "./src"`.
