# AUTHORING.md: Writing and Maintaining the Docs

Rules for **writing** documentation in this folder. Agents that only need to *read* the docs should start from [AGENTS.md](../AGENTS.md); they don't need this file.

This folder (`research-documentation/implementation-v2/`) is the second version of the component-focused documentation experiment. Its logic is the same as `complete/` and `research-documentation/implementation-v1/`. The v2 changes are designed to cut **model round trips**, which drive token cost far more than document size. See `research-documentation/docs/research-documentation-v2.md` at the repository root.

**Who the docs are for:** AI/LLM agents. Write dense, factual, linked docs that let an agent answer from the doc without opening code, and that point at exact line ranges when it must.

---

## 1. Structure

| Layer | Files | Purpose |
|---|---|---|
| Entry | `AGENTS.md` (auto-loaded by Copilot CLI, Codex, and others) | Reading rules plus the **routing table**: task → docs to read in one batch. Keep it under ~40 lines |
| Flows | `docs/flows/*.md` | One read per cross-layer feature: UI → service → route → service → DB, with `file:line` anchors and key values |
| Component docs | `<file>.md` beside each code file | Purpose, values, rules, bugs, connections, `Anchors:` |
| Index | `code.md` | Every doc with a one-line description, plus the generated **Symbol index** |
| Shared | `docs/PRD.md`, `docs/SETUP.md`, `docs/DEPLOYMENT_NOTES.md` | Requirements, setup, deployment, for people and for those specific questions |
| Authoring | `docs/AUTHORING.md` (this file) | Rules for writers, kept out of the default reading path |

Keep the folder root clean: only `AGENTS.md`, `code.md`, and project config. Agents tend to open every `.md` file at the root.

## 2. Where component docs live

Every code file gets a markdown file **beside it, with the same base name** (`worker/src/services/combat.ts` → `combat.md`).

- Document source code only: `.ts`, `.sql`, `.scss`, `.css`, and `.html` files that carry logic or structure.
- Don't document generated or local-state folders (`node_modules/`, `dist/`, `.angular/`, `.wrangler/`).
- Small config files are covered by the doc of the code that uses them, or by `docs/SETUP.md`.
- Trivial files (`main.ts`, `environment.ts`) can share a doc with their closest parent.
- **Angular components are one unit.** `x.component.ts` + `.html` + `.css` + `.spec.ts` share one `x.component.md`, which has a `Files:` line and a `Tests` line. Never inline `template` or `styles` back into the `.ts` file.

## 3. Content rules

- **Maximum 250 lines per doc**; most are 20–60.
- **Answer-complete:** put the values agents come looking for in the doc itself (thresholds, origins, item names, TTLs), not just the constant's name.
- **Anchors:** every component doc has a generated `Anchors:` block (`symbol:line`) between `<!-- anchors:start -->` and `<!-- anchors:end -->`. Don't edit it by hand.
- Record what the code can't tell you: why, invariants, gotchas. Don't restate code line by line.
- Tables and bullets, not paragraphs.
- **Connections (required):** link parents (importers) and children (imports) on **both** ends, as relative links to the other docs. HTTP counts: a route doc names its frontend caller, and `game-api.service.md` links each method to its route doc. Skip third-party packages.

## 4. Component doc template

The H1, summary, **Rules & gotchas**, and **Connections** names are fixed. A domain-specific section (`Endpoints`, `Flow`, `Layout`, `Tables`) may replace Responsibilities or Key exports.

```markdown
# <file name>

<One or two sentences: what this file does and why.>

Files: `.ts`, `.html`, `.css`, `.spec.ts`          ← components only
Tests (`.spec.ts`): <covered; not covered>          ← components only

<!-- anchors:start -->                              ← generated
Anchors (`x.ts`): `fn:12`, `OtherFn:40`
<!-- anchors:end -->

## Key exports
| Name | Kind | Purpose |
|---|---|---|

## Rules & gotchas
- <invariants, values, bugs by ID>

## Connections
**Parents (used by):** …
**Children (uses):** …
```

## 5. Flows and routing

- Add a `docs/flows/<feature>.md` when a question needs more than three component docs to answer. Number the steps, give `file:line` for each, and end with links to the component docs.
- Every flow and every feature area must have a row in the `AGENTS.md` routing table. A row lists **everything** needed for that task type, so the agent reads it in one parallel batch.
- New endpoint or feature work starts from [flows/add-endpoint.md](flows/add-endpoint.md).

## 6. `code.md` and the symbol index

- The upper part of `code.md` lists every doc with a one-line description (15 words or fewer), grouped by area.
- The **Symbol index** at the bottom (endpoints, plus `symbol:line` by file) and every `Anchors:` block are generated. After any code change that moves lines, run this from the repository root:

  ```bash
  node research-documentation/work/scripts/build-symbol-index.mjs ../implementation-v2
  ```

## 7. Shared docs and bugs

- Keep `docs/PRD.md`, `docs/SETUP.md`, and `docs/DEPLOYMENT_NOTES.md` accurate. Update the matching section when a change affects requirements, the API, setup, or deployment.
- Bugs live once in `bugs.md` at the **repository root**, by ID (`B-01`…). Reference them from docs by ID only; for example, `worker/src/services/combat.md` links `../../../../../bugs.md` (up to this folder's root, then two more levels to the repository root, since this folder lives in `research-documentation/`). Fixing a bug means deleting its entry and its references.

## 8. Definition of done

- [ ] Every new or changed code file has an up-to-date doc beside it (one per Angular component).
- [ ] Parent and child links are correct on both ends of every changed import.
- [ ] Flows and the `AGENTS.md` routing table cover any new feature area.
- [ ] The symbol index and anchors were regenerated.
- [ ] `code.md` lists every doc; no broken links; no doc over 250 lines.
- [ ] Shared docs and the root `bugs.md` reflect the change.

## 9. Core design principle

> **The Worker owns the rules; the AI owns the prose.** Dice, combat math, HP, XP, loot, and gold are computed in Worker code. Workers AI only narrates results it is given and never decides outcomes.
