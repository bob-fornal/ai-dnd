# Research Documentation v3: Fixes from the v2 Measurement

**Status:** implemented and measured (`iso-1`, §5).
**Folders:** [`research-documentation-v3/`](../research-documentation-v3/) (docs), [`research-work/`](../research-work/README.md) (arms `research-v3`, `research-v3-noauto`).
**Builds on:** [research-documentation-v2.md](research-documentation-v2.md). Read that first for the design (auto-loaded `AGENTS.md` routing table, flow docs, symbol index, anchors) and the `full-1` + `v2-1` results.
**Date:** 2026-10-09

## 1. Why a v3

The `v2-1` measurement (§5b of the v2 write-up) found three problems:

| # | Finding | Kind | Fix |
|---|---|---|---|
| 1 | Agents resolved doc paths against the **git repository root**, not the arm folder: 27/33 `research-v2` runs and 22/24 `research-v1-guided` runs made out-of-folder attempts that were denied, costing extra round trips | **Harness** (every arm ran as a subfolder of one repo) | Isolated workspaces for every arm (§3), so all versions are re-measured |
| 2 | Even with an isolated root, nothing in v2 told the agent what its paths were relative to | **Docs** | v3 `AGENTS.md` states that all paths are relative to its own folder |
| 3 | `research-v2-noauto` scored 3/5 on `starting-gear` in 2 of 3 runs: the flow listed the items but not **where they're defined** | **Docs** | v3 flow names `CLASS_STARTING_ITEMS` (`character.ts:65`) and the `items` rows in `seed.sql`; new authoring rule "name the source of every value" |

v2 is left exactly as it was measured in `v2-1`, so v2 and v3 can be compared directly.

## 2. What changed from v2

Only two files differ (`diff -rq research-documentation-v2 research-documentation-v3`), plus v3's self-references and authoring rules:

| File | Change |
|---|---|
| `AGENTS.md` | New line under "How to gather context": *All paths in this file and in every doc are relative to the folder that contains this `AGENTS.md` (the project root). Resolve them from here, not from any parent directory.* |
| `docs/flows/character-creation.md` | Names `CLASS_STARTING_ITEMS` (`worker/src/services/character.ts:65`) and the `items` rows in `worker/src/db/seed.sql` (IDs by insert order) as the source of the starting-items table |
| `docs/AUTHORING.md` | New content rules: **name the source of every value**, and **keep the root-relative path statement** in `AGENTS.md`; folder references updated to v3 |
| `docs/SETUP.md` | Folder name in the project tree |

The application code, component docs, other flows, routing table, symbol index, and anchors are identical to v2.

## 3. Harness change: isolated workspaces

`research-work/scripts/run.mjs` now copies each arm folder to `<workspaceRoot>/<label>/<folder>` before running (default `../../ai-dnd-research-workspaces`, a sibling of the repository) and runs `git init` there.

- **Relative paths resolve against the arm's own root**, as they would in a real project.
- **No repository-level instructions leak in.** Copilot now sees only the workspace's own `AGENTS.md` (checked with `copilot instruction list`), never the ai-dnd root file.
- **No arm gets `node_modules`**, which removes the old parity confound (`dist/`, `.angular/`, `.wrangler/` are excluded too).
- **Workspaces are outside the system temp folder**, and runs pass `--disallow-temp-dir`, so an agent can't wander into another arm's copy.
- Copies are made once per label, on first use, and reused when a run resumes. Editing a source folder during a run doesn't change it.
- Each run's `meta.json` records `workspaceDir`, and `reparse.mjs` uses it. `--no-isolate` restores the old behavior.

In the smoke test (`iso-smoke`, `shop-sell`), out-of-folder attempts dropped to zero for both `research-v1-guided` and `research-v2`.

Because isolation changes conditions for every arm, `full-1` and `v2-1` are **not** directly comparable with `iso-1`. `iso-1` re-measures all eight arms under the same conditions:

| Arm | Docs | Auto-load |
|---|---|---|
| `complete`, `complete-guided` | baseline | no |
| `research-v1`, `research-v1-guided` | v1 | no |
| `research-v2`, `research-v2-noauto` | v2 | yes / no |
| `research-v3`, `research-v3-noauto` | v3 | yes / no |

8 arms × 11 tasks (3 held out) × 3 repeats = 264 sessions.

```bash
node scripts/analyze.mjs results/runs/iso-1
```

## 4. What to look for

1. **Did isolation change the baseline story?** Compare `iso-1` round trips and input for v1-guided and v2 against `v2-1`. Those arms should drop the most.
2. **v3 vs v2:** fewer wasted path attempts with auto-load, and `starting-gear` back to 5/5 without auto-load.
3. **Held-out tasks** (`log-pagination`, `local-login`, `shop-sell`): does any doc version beat `complete` once paths work?
4. **Auto-load vs no auto-load**, now that only the arm's own `AGENTS.md` loads.

**Next version:** [v4](research-documentation-v4.md) keeps v3's content but moves component docs to `docs/code/`.

## 5. Results (`iso-1`, isolated, 10 arms × 11 tasks × 3 repeats = 330 runs)

Full tables: `research-work/results/runs/iso-1/summary.md`. Below, each value is the **sum of per-task medians**, which is steadier than one median over all runs. Original = the 8 tasks the flows were written for; held out = the 3 tasks with no flow doc.

| Arm | Input, original 8 | Input, held-out 3 | Input, all 11 | vs `complete` | Round trips (orig / held) | AI credits |
|---|---|---|---|---|---|---|
| complete | 1,209K | 365K | 1,573K | — | 40 / 11 | 81.0 |
| complete-guided | 1,799K | 470K | 2,269K | +44% | 68 / 20 | 115.0 |
| research-v1 | 1,074K | 269K | 1,343K | −15% | 31 / 7 | 71.9 |
| research-v1-guided | 1,818K | 732K | 2,550K | +62% | 67 / 27 | 120.6 |
| research-v2 | 525K | 399K | 924K | −41% | 22 / 16 | 59.6 |
| research-v2-noauto | 705K | 522K | 1,227K | −22% | 31 / 21 | 66.4 |
| **research-v3** | **522K** | **321K** | **843K** | **−46%** | **22 / 13** | **57.3** |
| research-v3-noauto | 655K | 418K | 1,073K | −32% | 29 / 17 | 63.1 |
| research-v4 | 498K | 296K | 794K | −50% | 21 / 11 | 56.0 |
| research-v4-noauto | 688K | 440K | 1,128K | −28% | 30 / 18 | 65.2 |

Answer scores: the median is 1.00 for every arm. Per task, the v2–v4 arms match or beat the baseline (`inventory-dialog` and `level-up-flow` go from 0.83 to 1.00), with isolated 0.80 dips (`research-v4` on `shop-sell`, `research-v2-noauto` on `starting-gear`).

**Findings**
1. **Isolation changed the conclusion.** Unisolated, v2 looked worse than the baseline (`v2-1`: 146K vs 115K median). Isolated, v2 is −41% and v3 −46% across all 11 tasks. The earlier result was mostly the git-root path artifact.
2. **v2–v4 cut input by ~57% on the original tasks** (≈500K vs 1,209K), with about half the round trips (21–22 vs 40). Agents answer from docs: a median of 0 code files and 2–3 tool calls per run.
3. **v3's fixes matter on unfamiliar tasks.** On held-out tasks, v2 was +9% vs `complete` and v3 is −12% (13 vs 16 round trips). The path statement and named value sources help most where no flow doc exists.
4. **Auto-loading `AGENTS.md` is worth ~20–30%.** Every auto-load arm beat its no-auto-load twin (v3: 843K vs 1,073K).
5. **Telling an agent to "use the docs" without a routing table backfires.** `complete-guided` (+44%) and `research-v1-guided` (+62%) are the two most expensive arms.
6. **Remaining weak spot: `log-pagination`.** Every v2–v4 arm needs 5–8 round trips (123K+ input) where `complete` and `research-v1` need 2 (≈75K). It has no flow and no routing-table row; a one-line routing entry (log → `routes/log.md` + `game-console`) is the obvious next fix. **Done in [v5](research-documentation-v5.md):** `log-pagination` fell to 73K / 3 round trips, on par with `complete`.
7. **Unguided v1 does best on held-out tasks** (269K): its agents hand searching to the cheap search subagent (30/33 runs). v2–v4 agents almost never do, because the routing table points them straight at docs.
