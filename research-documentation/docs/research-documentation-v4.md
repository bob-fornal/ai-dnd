# Research Documentation v4: Component Docs in `docs/code/`

**Status:** implemented and measured (`iso-1`, §4).
**Folders:** [`research-documentation/implementation-v4/`](../implementation-v4/) (docs), [`research-documentation/work/`](../work/README.md) (arms `research-v4`, `research-v4-noauto`).
**Builds on:** [v2](research-documentation-v2.md) (design and first results) and [v3](research-documentation-v3.md) (fixes and isolated harness).
**Date:** 2026-10-09

## 1. Question

v1–v3 keep each component doc **beside its code** (`worker/src/services/combat.ts` + `combat.md`). That makes docs easy to find when you're already looking at the code, but it puts markdown files throughout the source tree. Search tools return both the `.ts` and the `.md` for the same name, and a codebase's owners may not want docs mixed into the source tree.

v4 tests the alternative: **all component docs in one `docs/code/` tree that mirrors the source paths, with explicit links back to the code.** Does the agent still find the right context as cheaply when docs aren't next to the code?

## 2. What changed from v3

| Area | v3 | v4 |
|---|---|---|
| Component doc location | Beside the code: `worker/src/services/combat.md` | Mirrored tree: `docs/code/worker/src/services/combat.md`; source folders contain no `.md` files |
| Link to code | Implicit (same folder, same name) | A **`Code:` line** under each H1 linking every source file the doc covers, main file first (e.g. `inventory.component.ts`, `.html`, `.css`, `.spec.ts`; `main.ts` + `index.html`) |
| `AGENTS.md` rule 2 | "doc beside it with the same name" | "doc under `docs/code/` that mirrors its path … starts with a `Code:` line" |
| Routing table, `code.md` index, symbol index | Link to adjacent docs | Link to `docs/code/…`; labels show the full doc path |
| `docs/AUTHORING.md` | Docs beside code | Docs in `docs/code/`; `Code:` line required; template and checklist updated |

Everything else is identical to v3: content, flows, path statement, anchors, value sources.

**How it was built:** a script moved all 33 component docs. It resolved every relative link in all 46 markdown files against the file's *old* location, mapped moved targets to their new paths, and re-relativized from the *new* location. It then added the `Code:` lines. `research-documentation/work/scripts/build-symbol-index.mjs` detects `docs/code/` and links the symbol index and anchors there.

**Checks:** 0 broken links; all 72 import connections still linked on both ends; every doc in `docs/code/` has a `Code:` line; no `.md` files left under `worker/` or `frontend/`.

## 3. Measurement

v4 runs in the same isolated harness as everything else ([v3 §3](research-documentation-v3.md#3-harness-change-isolated-workspaces)): its own workspace and git root, no `node_modules`, `--disallow-temp-dir`.

| Arm | Docs | Auto-load |
|---|---|---|
| `research-v4` | v4 | yes |
| `research-v4-noauto` | v4 | no; the prompt points at `AGENTS.md` |

Both arms are added to the `iso-1` label (11 tasks × 3 repeats = 66 sessions) and start automatically once the 8 original arms finish. So one `analyze` call covers all ten arms:

```bash
node scripts/analyze.mjs results/runs/iso-1
```

**The comparison that answers the question is v4 vs v3**, since the content is the same and only the location differs. Watch:
- **Round trips and input tokens:** does the extra directory depth or the separate tree cost lookups?
- **Code reads:** do agents use the `Code:` links to open source, or answer from the docs as in v3?
- **Search noise:** v4's `grep`/`glob` results no longer mix `.md` and `.ts` files with the same name.
- **Answer scores**, especially on held-out tasks.

**Caveat:** the v4 arms run after the other eight, at a different time, so service load and prompt-cache state may differ slightly from the rest of `iso-1`.

## 4. Results (`iso-1`)

Sums of per-task medians, same isolated run as all other arms (see [v3 §5](research-documentation-v3.md#5-results-iso-1-isolated-10-arms--11-tasks--3-repeats--330-runs) for every arm):

| Arm | Input, original 8 | Input, held-out 3 | Input, all 11 | Round trips (orig / held) | AI credits |
|---|---|---|---|---|---|
| research-v3 (docs beside code) | 522K | 321K | 843K | 22 / 13 | 57.3 |
| **research-v4 (docs in `docs/code/`)** | **498K** | **296K** | **794K (−6%)** | **21 / 11** | **56.0** |
| research-v3-noauto | 655K | 418K | 1,073K | 29 / 17 | 63.1 |
| research-v4-noauto | 688K | 440K | 1,128K (+5%) | 30 / 18 | 65.2 |
| complete (baseline) | 1,209K | 365K | 1,573K | 40 / 11 | 81.0 |

**Findings**
1. **Moving the docs out of the source tree costs nothing.** With auto-load, v4 is slightly *cheaper* than v3 (−6% overall, −8% on held-out tasks). Without auto-load it's slightly more expensive (+5%). Both gaps are within run-to-run noise at 3 repeats; on 8 of 11 tasks the per-task medians are within ~2%.
2. **v4 is the cheapest arm overall**: −50% input and −31% AI credits vs `complete`, with the same answer quality (median 1.00; one 0.80 median on `shop-sell`).
3. **The biggest v4 gain was `shop-sell`** (held out): 127K vs v3's 152K, and 4 round trips vs 6. That fits the hypothesis that `grep`/`glob` results without same-named `.md` files beside the code are less noisy, but it's one task.
4. **Agents didn't need the `Code:` links**: a median of 0 code files were read, as in v3. The links cost almost nothing and are there when a change requires the source.

**Next version:** [v5](research-documentation-v5.md) adds routing rows for the areas v4 left unrouted (adventure log, quests).

**Conclusion:** where the component docs live (beside the code or in `docs/code/`) doesn't measurably change token cost. What matters is the entry point (an auto-loaded `AGENTS.md` routing table), flow docs, and root-relative paths. Choose the layout on maintainability: `docs/code/` keeps the source tree clean, and adjacent docs are harder to forget when editing code.
