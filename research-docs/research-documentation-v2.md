# Research Documentation v2: Designing Docs for Fewer Agent Round Trips

**Status:** implemented and smoke-tested; full measurement pending.
**Folders:** [`research-documentation-v2/`](../research-documentation-v2/) (docs), [`research-work/`](../research-work/README.md) (harness, arms `research-v2` and `research-v2-noauto`).
**Date:** 2026-10-09

## 1. Background

[`research-documentation-v1/`](../research-documentation-v1/) (v1; called `research-documentation/` during the `full-1` run) moved documentation from document types (one PRD, one setup guide) to **component docs beside each code file**, with an index (`code.md`) and an authoring guide (`AGENTS.md`, named `AGENT.md` during `full-1`). The goal was to lower the tokens an agent spends gathering context.

The [`research-work`](../research-work/README.md) harness runs the same read-only questions through GitHub Copilot CLI against each folder and records tokens, files read, and answer quality.

## 2. What v1 measurement showed

Findings below come from the first 67 runs of the `full-1` suite (8 tasks × 4 arms, repeats 1–2 complete). Final numbers will be in `research-work/results/runs/full-1/summary.md`. That run used the arm IDs `research` and `research-guided`, which the harness now aliases to `research-v1` and `research-v1-guided`.

| Arm | Main-agent requests / run | Main-agent input / run | Avg context per request | File tokens read / run |
|---|---|---|---|---|
| complete | 4.9 | 128K | 26K | ~7K |
| research (v1) | 5.2 | 134K | 26K | ~8.6K |
| complete-guided | 8.9 | 239K | 27K | ~5K |
| research-guided (v1) | 10.1 | 271K | 27K | ~6.5K |

1. **Round trips drive cost, not document size.** Every model request resends the full context, and about 23K tokens of it is a fixed system prompt plus tool definitions. Total input ≈ requests × ~26K. The files read are only 2–4% of input.
2. **Following v1's own instructions made it more expensive.** `research-guided` read the fewest file tokens of any arm but cost the most, because v1's AGENTS.md → code.md → component doc → linked doc is a chain of sequential steps (about 10 requests per run).
3. **Agents read sequentially.** About 1.4 tool calls per model turn, so most reads cost their own round trip.
4. **Unguided agents open whatever is at the root.** In `research`, v1's AGENTS.md was read in 9 of 17 runs and PRD.md in 8, even when irrelevant.
5. **Searching triggers expensive subagents.** Some sessions hand symbol searches to a search subagent costing about 25K–30K tokens.

**Design rule for v2:** optimize for the **fewest sequential model requests** to reach the answer, not the fewest bytes.

## 3. What v2 changes

| # | Change | v1 problem it targets | Implementation |
|---|---|---|---|
| 1 | **Auto-loaded entry file** | 1–2 round trips to read v1's AGENTS.md and code.md, plus about 2.3K tokens of writer-only rules every run | [`AGENTS.md`](../research-documentation-v2/AGENTS.md) (30 lines), which Copilot CLI, Codex, and others load into the system prompt with no tool call. Writer rules moved to [`docs/AUTHORING.md`](../research-documentation-v2/docs/AUTHORING.md) |
| 2 | **Task routing table** | The agent had to work out which docs apply from a folder-ordered index, then follow links | `AGENTS.md` maps 15 task types to the exact docs to read, e.g. *Level-up → docs/flows/level-up.md* |
| 3 | **Flow docs** | Cross-layer questions needed 7–17 doc reads | [`docs/flows/`](../research-documentation-v2/docs/flows/): `action-loop`, `combat`, `character-creation`, `level-up`, `resume-session`, `inventory`, plus an `add-endpoint` recipe. Each traces UI → service → route → service → DB with `file:line` anchors and key values (21–33 lines each) |
| 4 | **Batch instruction** | ~1.4 tools per turn | `AGENTS.md` step 1: "read all its docs in one parallel batch of tool calls" |
| 5 | **Symbol index** | Symbol searches, sometimes through a ~25K-token subagent | A generated index at the end of [`code.md`](../research-documentation-v2/code.md): 13 endpoints (method, path, `file:line`, doc) and every exported symbol and public method as `symbol:line` |
| 6 | **Anchors and answer-complete docs** | Whole-file code reads to confirm a value | A generated `Anchors:` block in all 29 code-backed docs; key values written into docs (XP thresholds, hit dice/AC, racial bonuses, starting items by name) |
| 7 | **Clean root** | Agents opened PRD.md and SETUP.md by default | `PRD.md` and `SETUP.md` moved to `docs/`; the root holds only `AGENTS.md`, `code.md`, and project config. Every link rewritten and verified |

Unchanged from v1: one doc per code file (one per Angular component across `.ts`/`.html`/`.css`/`.spec.ts`), parent and child links on both ends, the 250-line cap, bugs referenced by ID from the root [`bugs.md`](../bugs.md), and the same application code (`node_modules/` linked to v1's for parity).

### Generated content

`research-work/scripts/build-symbol-index.mjs` writes the symbol index and every `Anchors:` block. Line numbers go stale when code moves, so `docs/AUTHORING.md` makes regenerating them part of the definition of done:

```bash
node research-work/scripts/build-symbol-index.mjs ../research-documentation-v2
```

## 4. How it's measured

Two new arms in [`research-work/config.json`](../research-work/config.json):

| Arm | Setup | Isolates |
|---|---|---|
| `research-v2` | v2 folder; `--no-custom-instructions` **removed** so `AGENTS.md` auto-loads; no preamble | The full v2 design as an agent would meet it |
| `research-v2-noauto` | v2 folder; custom instructions off; preamble "read AGENTS.md and follow it" | v2's content and structure without the auto-load. The gap to `research-v2` is the value of auto-loading |

Harness additions:
- **Per-arm Copilot flags** (`removeArgs`, `extraArgs`) in `run.mjs`.
- **`Main-agent model requests (round trips)`**, now the headline metric in `summary.md` next to input tokens.
- **Three held-out tasks** (`log-pagination`, `local-login`, `shop-sell`) covering areas **with no flow doc**. The flows were written knowing the original 8 tasks, so gains on held-out tasks are the stronger evidence. They're marked *(held out)* in `summary.md`.

To run the new arms on all 11 tasks, and the original arms on the held-out tasks:

```bash
cd research-work
node scripts/run.mjs --arms research-v2,research-v2-noauto --label v2-1
```

```bash
node scripts/run.mjs --tasks log-pagination,local-login,shop-sell --arms complete,complete-guided,research-v1,research-v1-guided --label v2-1
```

```bash
node scripts/analyze.mjs results/runs/v2-1
```

## 5. Smoke test

One run of `research-v2` on `level-up-flow` (`results/runs/smoke-v2`):

| Measure | research-v2 (1 run) | v1 arms, same task (runs so far) |
|---|---|---|
| Main-agent requests | **2** | 5–10 |
| Input tokens | **45,660** | 75K–336K |
| Files read | 1 (`docs/flows/level-up.md`) | 6–10 |
| Answer score | 6/6 | 5/6–6/6 |

The agent never opened `AGENTS.md` with a tool; the routing table was already in its context. It read one flow doc and answered. That confirms the mechanism works. It is **not** a result: one sample, on a task the flow was written for.

## 6. Risks and open questions

- **Overfitting to the test set:** the flows cover the original tasks. The held-out tasks address this; if v2 wins there too, the gain comes from the structure, not from tailoring.
- **Maintenance cost:** flows and anchors duplicate facts from the code and go stale. The generator covers anchors; flows need review whenever a feature changes. Track how often they drift.
- **Auto-load portability:** `AGENTS.md` is read by Copilot CLI, Codex, and several other agents, but not all. The `research-v2-noauto` arm measures the fallback.
- **Fixed overhead dominates:** about 23K tokens per request come from the agent's own system prompt and tools. Docs can only cut the *number* of requests, so expect savings to scale with how many steps a task takes.
- **Repository instructions:** the repository root also has an `AGENTS.md` (Angular rules, about 3.3 KB). With custom instructions on, Copilot loads it alongside v2's own file, so `research-v2` pays about 800 extra tokens per request that the no-auto-load arms don't. This works *against* v2, so it doesn't inflate its gains.
- **Variance:** tool family (`view` vs `read_file`) and subagent use differ per session. Use the **Run conditions** table in `summary.md` and three or more repeats.

## 7. Next steps

1. Let `full-1` finish and record the final v1 baseline.
2. Run `v2-1` (the commands above): 2 arms × 11 tasks × 3 repeats = 66 sessions, plus 4 arms × 3 held-out tasks × 3 repeats = 36 sessions.
3. Compare **round trips** and input tokens on original vs held-out tasks, and check that answer scores hold.
4. If v2 holds up, carry the pattern (auto-loaded routing file, flows, generated symbol index) back into `research-documentation-v1/` or the workshop.
