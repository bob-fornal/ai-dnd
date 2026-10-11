# Next Steps

What to do after the `iso-1` (Copilot) and `claude-iso-1` (Claude Code) measurements, in priority order. Each step says why it matters, what to build, and how to know it worked. Context: [talk shell](agentic-ai-token-usage-talk.md) (all stages and results) and [harness](../work/README.md).

**Where things stand:** ~1,140 measured sessions. An auto-loaded `AGENTS.md` routing table plus flow docs cut input by ~50% on Copilot and ~25% on Claude Code at equal answer quality. Layout and a multi-read tool made no measurable difference. **The weak points are generalization (held-out tasks), precision (3 repeats), and the Q&A-only task set.**

---

## 1. Commit the reorganized research ✅ prerequisite

**Why:** checkpoint before new versions and runs.
**What:** commit the move to `research-documentation/` (`docs/`, `work/`, `implementation-v1` … `-v6`) and the path updates as one logical change.
**Done when:** `git status` is clean, and `node research-documentation/work/scripts/run.mjs --dry-run` resolves every arm.

## 2. Implementation v7: answer-completeness pass

**Why:** once docs are routed, each fact missing from a doc costs one extra turn, however reads are batched (v5 and v6 findings). This is the largest remaining lever on both agents.
**What:** copy `implementation-v4` → `implementation-v7` and write in the facts agents still opened code for:
- the CORS origin function (the allowed patterns, and exactly where to add a domain): `worker/src/index.ts`
- the end-of-log rule: **Load more** disables when `logPage × 20 ≥ total`
- the sell-price math: `floor(value × 0.5) × quantity`, plus which checks run first
- the AI fallback chain: models in order, what triggers each fallback, which helpers lack it

Find more by listing the code files each routed arm still read (`metrics.json` → `filesRead`) and adding those facts to the matching component doc or flow. Add `research-v7` / `research-v7-noauto` arms.
**Done when:** v7 needs fewer round trips than v4 on the tasks that still read code (`cors-origin`, `ai-fallback`, `log-pagination`, `shop-sell`), and no task gets worse.

## 3. Close the held-out gap

**Why:** on Claude Code, the plain baseline beat every docs version on the 3 held-out tasks. That's the result an audience will challenge.
**What:** write **5–6 new held-out tasks** in areas no flow targets (e.g. quest generation, equip rules, the dice engine, environment/deploy config, the auth guard, theme overlays). Mark them `heldOut: true` and keep them out of any doc tuning. Run them blind against `complete`, v3, v4, and v7 on both agents.
**Done when:** v7 matches or beats `complete` on held-out tasks on both agents. If it doesn't, the finding is "docs help anticipated tasks only", which still belongs in the talk.

## 4. Tighten the numbers

**Why:** 3 repeats couldn't separate ±10% effects (one arm's three `shop-sell` runs ranged 104K–212K).
**What:** for the arms that matter (`complete`, v3, v4, v7; auto-load only), run **5+ repeats** on both agents. Report per-task spreads (min / median / max), not just medians.

```bash
node scripts/run.mjs --arms complete,research-v3,research-v4,research-v7 --repeats 5 --label precision-1
```

```bash
node scripts/run.mjs --agent claude --arms complete,research-v3,research-v4,research-v7 --repeats 5 --label claude-precision-1
```

**Done when:** each headline difference in the talk either clears the spread or is labeled as noise.

## 5. Answer the questions an audience will ask

| Question | Experiment |
|---|---|
| Does it hold for **code changes**, not just Q&A? | 2–3 edit tasks (e.g. implement the rest endpoint), graded by tests or by a diff checklist. Line-range reads (`tools/read.mjs`) may pay off here |
| Does it hold on a **large legacy repository**? | Apply the v4/v7 pattern to one bigger codebase: the scenario from the Phase 6 notes in [README.md](README.md) |
| Do **smaller models** benefit more? | Run the auto-load arms on Claude Code with Haiku, Sonnet, and Opus (`config.claude.model`) |
| Is it the **docs or the auto-load**? | Already measured (no-auto-load arms); keep both in every new run |

## 6. Build the talk

**What:** turn [agentic-ai-token-usage-talk.md](agentic-ai-token-usage-talk.md) into slides. Its outline, tables, and visual notes are ready. The headline chart is **round trips vs input tokens per arm**, on both agents.
**Done when:** a 40-minute deck matching the outline, with numbers updated from steps 2–4.

## 7. Housekeeping

- **Bugs:** fix the 14 defects in [`bugs.md`](../../bugs.md) in `complete/`, every implementation, and the workshop (starter TODOs and READMEs teach some of them), or flag them for workshop attendees.
- **Workspaces:** delete `C:\Projects\PERSONAL\ai-dnd-research-workspaces\` when you no longer need to reproduce runs. The copies contain no `node_modules`, so a plain delete is safe.
- **Raw logs:** `work/results/runs/**/events.jsonl` is git-ignored. Archive it if runs need re-parsing on another machine.

---

**Recommended single next action:** commit (1), then build v7 with the new held-out tasks (2 + 3) and run them with 5 repeats (4). Together these address the weakest points in the current findings.
