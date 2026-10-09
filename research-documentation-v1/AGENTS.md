# AGENTS.md: Component-Focused Documentation

This folder is a copy of `../complete/` used to test one idea: **documentation that sits next to the code it describes lowers the number of tokens an agent needs to load before doing a task.** The application logic is the same as `complete/`. The documentation is organized differently, and the Angular components here are split into separate files.

**Who these docs are for:** AI/LLM agents. Every markdown file beside the code exists so an agent can load the context around a component (what it does, its rules, what it connects to) in the fewest tokens, without reading unrelated files or the whole PRD. Write for that reader: dense, factual, and linked. Prose for people goes in the shared docs (`PRD.md`, `SETUP.md`, `docs/`).

Follow these rules when reading, writing, or changing anything in this folder.

---

## 1. Where documentation lives

Every code file gets a markdown file **beside it, with the same base name**:

| Code file | Documentation file |
|---|---|
| `worker/src/services/combat.ts` | `worker/src/services/combat.md` |
| `worker/src/routes/shop.ts` | `worker/src/routes/shop.md` |
| `frontend/src/app/components/game-console/game-console.component.ts` | `frontend/src/app/components/game-console/game-console.component.md` |
| `frontend/src/app/services/game-api.service.ts` | `frontend/src/app/services/game-api.service.md` |
| `worker/migrations/0001_initial_schema.sql` | `worker/migrations/0001_initial_schema.md` |

- Document source code only: `.ts`, `.sql`, `.scss`, `.css`, and `.html` files that carry logic or structure.
- Do not document generated or local-state folders (`node_modules/`, `dist/`, `.angular/`, `.wrangler/`).
- Small config files (`tsconfig*.json`, `angular.json`, `package.json`) don't need their own doc. Cover them in the doc of the code that depends on them, or in [SETUP.md](SETUP.md) if they matter for setup.
- Trivial files (for example `main.ts`, `environment.ts`) can share a doc with their closest parent if a separate file would only repeat it.

### Angular components are one unit

Angular can split a component across several files. **Treat all of them as one component with one doc**, named after the component, not after each file:

| Component files | One doc |
|---|---|
| `inventory.component.ts` + `.html` + `.css` + `.spec.ts` | `inventory.component.md` |

- The doc covers the class (`.ts`), the template (`.html`), the styles (`.css`), and the tests (`.spec.ts`). Add a short **Files** line listing which parts exist, for example `Files: .ts, .html, .css, .spec.ts`.
- When you change any one of those files, the component doc is the doc to update.
- When you read a component, open its doc first, then only the part you need (template, styles, or class) rather than all three.
- Components in this folder are split into `.ts`, `.html`, `.css`, and `.spec.ts`, following the root [../AGENTS.md](../AGENTS.md). Never put an inline `template` or `styles` back into the `.ts` file.
- The same rule applies to any other code split by concern (for example a service and its `.spec.ts`): one doc per logical unit.

## 2. Keep each doc short

Make every effort to keep documentation concise. **The absolute maximum is 250 lines per file.** Most docs should be far shorter, often 20 to 60 lines.

- Describe *what the file is for* and *how it connects*. Don't restate the code line by line, because the agent can read the code.
- Record what the code can't tell you: why a decision was made, rules that must hold, known gotchas.
- Use tables and bullet lists, not paragraphs.
- If a doc approaches 250 lines, the code file is probably doing too much. Note that in the doc rather than padding it.

## 3. Connections (required)

Every doc links both up and down the dependency graph, using relative markdown links to the **other docs**, not to the code files.

- **Parents:** every file that imports or uses this file (for example, a route that calls a service, or a component that injects a service). Link to the parent's doc.
- **Children:** every local file this file imports (services, components, types, models). Link to each child's doc.
- **HTTP boundaries count as connections.** A Worker route doc names the frontend service method that calls it ("Called over HTTP by"), and the frontend API service doc links each method to its route doc.
- Leave out third-party packages (Hono, Angular, Angular Material). Name them in the summary if they matter, but don't link them.
- When you add, remove, or change an import, update the connections in **both** docs: this file's and the file on the other end.

An agent should be able to start at any doc and walk to everything it touches without opening `PRD.md`.

## 4. Doc template

Use this structure. Leave out sections that don't apply instead of writing "N/A".

- The H1, the summary, **Rules & gotchas** (when there are any), and **Connections** are fixed. Always use those names, so an agent can jump straight to them.
- Between the summary and **Rules & gotchas**, you may use a domain-specific section in place of Responsibilities or Key exports when a table is clearer: for example `Endpoints`, `Request / response`, `Flow`, `Layout`, or `Tables`.
- Component docs add the `Files:` and `Tests` lines right after the summary.

```markdown
# <file name>

<One or two sentences: what this file does and why it exists.>

Files: `.ts`, `.html`, `.css`, `.spec.ts`          ← components only
Tests (`.spec.ts`): <what is covered; what is not>  ← components only

## Responsibilities
- <bullet>

## Key exports
| Name | Kind | Purpose |
|---|---|---|

## Rules & gotchas
- <invariants, edge cases, decisions that aren't obvious from the code>

## Connections
**Parents (used by):**
- [routes/combat.md](../routes/combat.md): calls `resolveAttack()`

**Children (uses):**
- [dice.md](dice.md): all random rolls
- [../types/index.md](../types/index.md): `Character`, `Monster`
```

## 5. The root index: `code.md`

[code.md](code.md) at the root of this folder lists **every** component doc, with a one-line description of each.

- Group entries by area: Worker entry, Worker routes, Worker services, Worker data (types, migrations, seed), Frontend app shell, Frontend components, Frontend services, Frontend models.
- Format: `- [path/to/file.md](path/to/file.md): <one line, 15 words or fewer>`
- Add an entry whenever you create a doc and remove it whenever you delete one. The index must never link to a missing file or leave a doc out.
- Keep it an index only. Content belongs in the component docs.

## 6. Shared documentation stays maintained

The top-level documents remain the reference for concerns that cut across components:

| Document | Covers |
|---|---|
| [PRD.md](PRD.md) | Product requirements, data model, API spec, prompt design |
| [SETUP.md](SETUP.md) | Local development and deployment steps |
| [docs/DEPLOYMENT_NOTES.md](docs/DEPLOYMENT_NOTES.md) | Production issues and their fixes |
| [../bugs.md](../bugs.md) | Known bugs (kept at the repository root, shared with `complete/`), each with an ID (`B-01`…), location, cause, and affected docs |

- **Bugs:** record each defect once in `../bugs.md` (repository root) and refer to it from component docs by ID, for example `([bugs.md B-02](../../../../bugs.md))`. Don't copy the details into the component doc. Fixing a bug means deleting its entry and the references to it. A newly found bug gets the next free ID.
- Keep these accurate. When a code change affects a requirement, an API shape, a setup step, or a deployment behavior, update the matching section in the same change.
- New cross-cutting documentation goes in `docs/`, in short single-topic files, with a link from `code.md`.
- Component docs may link to a specific heading in these files (for example `../../PRD.md#43-combat-system`) instead of copying the content.

## 7. How to gather context for a task

Load as little as possible, in this order:

1. Read [code.md](code.md) to find the docs that cover the task.
2. Read those component docs.
3. Follow **Connections** links only as far as the change actually reaches.
4. Open the code files you're changing.
5. Read `PRD.md`, `SETUP.md`, or `docs/` only when the task touches requirements, setup, or deployment, and read only the relevant section.

Don't read the whole PRD by default. If you had to, because a component doc was missing or wrong, fix that doc as part of the task.

## 8. Definition of done

A change in this folder is complete when:

- [ ] Every new or changed code file has an up-to-date doc beside it (one doc per Angular component, whatever its file split).
- [ ] `../bugs.md` reflects bugs fixed or found, and component docs reference them by ID.
- [ ] Parent and child links are correct on both ends of every changed import.
- [ ] `code.md` lists every doc, with no broken links.
- [ ] `PRD.md`, `SETUP.md`, and `docs/` reflect any cross-cutting change.
- [ ] No doc exceeds 250 lines.

## 9. Core design principle

This rule holds across the codebase, and every component doc that touches it should respect it:

> **The Worker owns the rules; the AI owns the prose.** Dice, combat math, HP, XP, loot, and gold are computed in Worker code. Workers AI only narrates results it is given and never decides outcomes.
