# Agentic AI Token Usage and Improvement

*A talk shell: every stage of the documentation-for-agents research in this repository, with its intent, what was built, what was measured, and what it taught.*

**Speaker:** Bob Fornal · **Repository:** `ai-dnd` · **Background notes:** [README.md](README.md) (Phases 1–6)
**Stage write-ups:** [v2](research-documentation-v2.md) · [v3](research-documentation-v3.md) · [v4](research-documentation-v4.md) · [v5](research-documentation-v5.md) · [v6](research-documentation-v6.md) · **Harness:** [research-work/README.md](../research-work/README.md)

---

## Abstract (for the program)

Most project documentation is written for people: a big PRD, a setup guide, deployment notes. AI coding agents now read that documentation too, and they pay for every token, every time. Across ~1,140 measured agent sessions on GitHub Copilot CLI and Claude Code, we rebuilt one real project's docs six times specifically for agents. The best version cut the input tokens needed to answer codebase questions by **~50%** on Copilot (~25% on Claude Code, whose baseline is already leaner) and cost by **~25–30%**, with no loss in answer quality. The biggest lesson wasn't about writing less. **Agent cost is driven by round trips, not by document size**, and the documentation that wins is the documentation that gets an agent to the right facts in the fewest steps. We'll also cover the measurement traps that nearly produced the opposite conclusion.

## Key takeaways (closing slide)

1. **Cost ≈ round trips × context.** Every model request resends the fixed context (~23K in Copilot, ~9K in Claude Code) plus the history. The documents themselves were 2–4% of input.
2. **Give agents an entry point.** An auto-loaded `AGENTS.md` with a **routing table** (task → exact docs) was the single biggest win on both agents: −50% input on Copilot, −25% on Claude Code. Auto-loading alone was worth 20–30%.
3. **"Read the docs" without routing backfires.** Agents told to use docs with no map were the most expensive of all (+44% to +115%).
4. **Answer-completeness beats clever tooling.** Once routed, each fact missing from a doc costs one extra turn. A multi-file read tool was used ~90% of the time and saved nothing.
5. **Layout doesn't matter; structure does.** Docs beside the code vs. in `docs/code/` made no measurable difference.
6. **Measure your harness before you trust it.** A path-resolution artifact made the best design look worse than the baseline until we isolated each run.
7. **Writing docs for agents finds bugs.** Documenting every file surfaced 14 real defects, some of them taught by the workshop itself.
8. **Leaner agents gain less, and caching changes the math.** Claude Code started cheaper than Copilot, so docs saved less. Compare cost, not just total tokens: cached context is cheap.

## Suggested talk flow (≈40 minutes)

| Min | Section | Stages | Visual |
|---|---|---|---|
| 0–4 | Why tokens matter; docs are written for us, not for LLMs | 0 | Quote from Phase 6 (Brandon Birk) and the "AI-centric docs" question |
| 4–8 | The project and the idea | 1–2 | Before/after doc tree |
| 8–13 | Building a fair measurement harness | 3 | Pipeline diagram: tasks × arms × repeats → Copilot CLI → usage + events → metrics |
| 13–18 | First surprise: round trips, not bytes | 4 | Table: round trips vs input tokens |
| 18–23 | Designing for fewer steps (v2) and a misleading result | 5–6 | `AGENTS.md` routing table; "the best design lost?" |
| 23–28 | The harness bug that flipped the conclusion | 6–8 | Out-of-folder path attempts per arm; before/after isolation |
| 28–34 | What actually matters: layout, routing, tools | 9–11 | v3 vs v4 vs v5 vs v6 table |
| 34–37 | Same tests on Claude Code | 12 | Copilot vs Claude table: same shape, smaller savings; caching vs cost |
| 37–40 | Lessons, next steps, Q&A | — | Key takeaways |

---

## Stage 0: Premise

**Intent.** Bob's earlier work (see [README.md](README.md)) suggested that restructuring documentation could cut agent token usage by 60–70%. A conversation about large codebases ("the tooling gets lost and has to rebuild context as it gets deeper into the component structure") prompted the question:

> Can we change the architecture of documentation to make reading and obtaining context more useful and more efficient for AI agents?

**Talking point:** we write `docs/` for humans. Agents read it differently: on demand, repeatedly, with a cost per token and per step.

## Stage 1: The test bed

**What it is.** `ai-dnd`: an AI-generated, D&D-like game (an Angular 18 SPA and a Cloudflare Worker using Hono, D1, KV, and Workers AI) plus a 4-hour workshop that teaches Workers AI by rebuilding it (`workshop/`, phases 00–09).

- `complete/` holds the finished app, with conventional docs: `PRD.md` (567 lines), `SETUP.md`, `docs/DEPLOYMENT_NOTES.md`.
- The repo's own rule: **the Worker owns the rules (dice, HP, XP); the AI only narrates.**

**Why it's a good test bed:** a real, multi-layer codebase with hand-written docs, small enough to measure exhaustively.

## Stage 2: v1, component docs beside the code

**Intent.** Replace "one big PRD" with **one small doc per code file**, placed next to it, so an agent loads only the context it needs.

**What was built** (`research-documentation-v1/`):
- A rules file for agents (`AGENT.md`, later `AGENTS.md`): docs are **for AI agents** (dense, factual, linked); **250-line maximum**; every doc links its **parents** (importers) and **children** (imports), including across HTTP (route ↔ API service); a root index `code.md`; shared docs (PRD, setup, deployment) stay maintained.
- 33 component docs. An Angular component split into `.ts` / `.html` / `.css` / `.spec.ts` is **one unit with one doc**.
- Automated checks: every file has a doc, all 72 import edges are linked both ways, and there are no broken links.

**Side finding: documentation as a bug hunt.** Writing a doc for every file surfaced **14 defects**, recorded once in a root `bugs.md` and referenced from docs by ID:
- Loot never drops (every seeded monster has a null loot table).
- Shop purchases fail in SQL (an upsert targets a unique index that doesn't exist).
- Three AI helpers read an outdated response format and always fall back to canned text.
- Potion healing is never saved; "Use Item" does nothing; expired sessions can't resume.
- The Inventory dialog renders at the bottom of the page (`mat.core()` missing).
- The **workshop teaches some of these bugs**: starter TODOs instruct the buggy code, and two phase READMEs claim the missing unique index exists.

**Talking point:** "documentation for agents" forces a complete, file-by-file read of the system, and that's a code review.

## Stage 3: Building the measurement harness

**Intent.** Replace "it feels cheaper" with numbers.

**What was built** (`research-work/`):
- **Tasks:** 8 read-only codebase questions (combat resolution, adding a "rest at the inn" endpoint, session expiry, the inventory dialog, AI fallbacks, starting gear, CORS, level-up). Each has **keyword groups** for grading, so cheaper can't mean worse. Later, **3 held-out tasks** were added in areas no doc was tailored to.
- **Arms:** each doc version, run **unguided** (no hint) and **guided** (the prompt points at the docs, or the docs auto-load).
- **Runner:** GitHub Copilot CLI, non-interactive (`copilot -p`), with the model and effort pinned. Runs are read-only (writes and shell denied), arm order is shuffled, and interrupted runs resume.
- **Metrics:** Copilot's `--usage-output-file` gives authoritative token totals (fresh and cached input, output, AI credits, per-agent splits). The `--output-format json` event stream shows **which files were read** and how many **round trips** each run took.

**Early surprises (probe and smoke test):**
- Copilot gives sessions **different tool families** (`view`/`grep` vs `read_file`/`grep_search`) and sometimes delegates to a **search subagent** on another model. The parser had to handle both, and the report gained a "run conditions" table.

## Stage 4: `full-1`, the first baseline (96 runs)

**Intent.** Compare the original docs (`complete`) with v1, unguided and guided.

| Arm | Round trips | Input tokens | AI credits |
|---|---|---|---|
| complete | 4 | 108K | 6.2 |
| complete-guided | 8 | 201K (+86%) | 10.3 |
| research-v1 | 4 | 138K (+27%) | 6.8 |
| research-v1-guided | 9 | 233K (+115%) | 10.7 |

*Medians; all answers scored 1.00.*

**Findings:**
1. **Round trips drive cost.** Each request resends ~26K tokens of context, so total input ≈ requests × 26K. Files read were only 2–4% of input.
2. **Following v1's own instructions made it the most expensive arm.** "Read AGENT.md → code.md → component doc → linked doc" is a chain of sequential hops.
3. Agents read **one file at a time** (~1.4 tool calls per turn) and **open whatever sits at the root** (`AGENT.md`, `PRD.md`).

**Talking point (the slide):** *Your docs aren't expensive because they're long. They're expensive because of how many steps it takes to get through them.*

## Stage 5: v2, designing for fewer steps

**Intent.** Optimize for the **fewest sequential model requests**, not the fewest bytes.

**What was built** (`research-documentation-v2/`):
| Change | Targets |
|---|---|
| **Auto-loaded `AGENTS.md`** (30 lines; read by Copilot CLI, Codex, Claude Code, …) | Removes 1–2 round trips; authoring rules moved out to `docs/AUTHORING.md` |
| **Routing table**: 15 task types → the exact docs to read | No more inferring which docs apply |
| **Flow docs** (`docs/flows/`): one read per cross-layer feature, UI → service → route → DB with `file:line` | Cross-layer questions needed 7–17 reads |
| **"Read all of them in one parallel batch"** | ~1.4 tools per turn |
| **Generated symbol index + `Anchors:` per doc** (`symbol:line`) | Replaces searching |
| **Answer-complete docs** (thresholds, origins, item names written in) | Replaces code reads |
| **Clean root** (PRD and setup moved into `docs/`) | Stops agents opening them by default |

**Smoke test:** one question answered in **2 round trips / 46K tokens** vs 75K–336K before.

## Stage 6: `v2-1`, a misleading result (102 runs)

**Intent.** Measure v2 at scale, with held-out tasks.

**What we saw:** v2 cut file reads by 65% and code reads to zero, yet it **cost more than the plain baseline** (146K vs 115K median input), and held-out tasks barely improved.

**What was really happening:** every arm ran as a subfolder of one git repository. When an agent followed a relative path from a doc, Copilot resolved it against the **repository root**, the path check denied it, and the agent spent turns finding its way back:

| Arm | Runs with out-of-folder path attempts |
|---|---|
| complete (unguided) | 0–2 of 24 |
| research-v1-guided | 22 / 24 |
| research-v2 | 27 / 33 |
| research-v2-noauto | 20 / 33 |

The penalty hit **exactly the doc-following arms**, and it would never happen in a real project.

**Talking point:** *the most important bug in this research was in the measurement, not the docs.* Look at what the agent actually did before trusting an average.

## Stage 7: Housekeeping that turned out to matter

- `AGENT.md` → `AGENTS.md` everywhere. `AGENTS.md` is the name agents **auto-load**, and once the root file had that name, Copilot loaded it as *repository instructions* into any session with instructions on. That's a new confound, measured with `copilot instruction list`.
- Folders were versioned (`research-documentation-v1` … `-v6`), and the harness gained **arm aliases** so old results combine with new ones.

## Stage 8: v3 plus an isolated harness (`iso-1`)

**Intent.** Fix the harness, then fix the two doc gaps `v2-1` revealed.

- **Harness isolation:** every arm runs from its own copy outside the repository, with its own `git init`, no `node_modules`, and no temp-folder access. Out-of-folder attempts fell to **zero**.
- **v3 docs:** `AGENTS.md` says that all paths are relative to its own folder, and flows name the **source** of every value (e.g. `CLASS_STARTING_ITEMS` in `character.ts`, rows in `seed.sql`).

**Results** (sum of per-task medians, 11 tasks × 3 repeats per arm):

| Arm | Input, all 11 tasks | vs complete | Round trips (orig / held-out) | AI credits |
|---|---|---|---|---|
| complete | 1,573K | — | 40 / 11 | 81.0 |
| complete-guided | 2,269K | +44% | 68 / 20 | 115.0 |
| research-v1 | 1,343K | −15% | 31 / 7 | 71.9 |
| research-v1-guided | 2,550K | +62% | 67 / 27 | 120.6 |
| research-v2 | 924K | −41% | 22 / 16 | 59.6 |
| **research-v3** | **843K** | **−46%** | **22 / 13** | **57.3** |
| research-v3-noauto | 1,073K | −32% | 29 / 17 | 63.1 |

**Findings:**
1. **Isolation flipped the conclusion.** v2 went from "worse than baseline" to −41%.
2. On the original tasks, routed docs cut input **~57%** and halved round trips. Agents answered from docs (median 0 code files, 2–3 tool calls).
3. v3's fixes matter most on **unfamiliar** (held-out) tasks: v2 was +9% vs complete there, v3 −12%.
4. **Auto-loading `AGENTS.md` is worth 20–30%** over pointing the agent at it.
5. "Use the docs" without a routing table remains the most expensive option.

## Stage 9: v4, does doc location matter?

**Intent.** Move component docs out of the source tree into `docs/code/` (mirroring paths, each with a `Code:` line linking its source files).

| | v3 (beside code) | v4 (`docs/code/`) |
|---|---|---|
| Input, all 11 | 843K | **794K (−50% vs complete)** |
| Round trips | 22 / 13 | 21 / 11 |
| AI credits | 57.3 | 56.0 |

**Finding:** no measurable difference. 8 of 11 tasks matched within ~2%, and agents didn't need the `Code:` links. **Choose layout for maintainability.** v4 is the most efficient version measured.

## Stage 10: v5, route every area

**Intent.** Fix the one task where docs still lost to the baseline: `log-pagination`. The routing table had **no row for the adventure log**, so agents fell back to grep loops.

| `log-pagination` | rep 1 | rep 2 | rep 3 | Median |
|---|---|---|---|---|
| v4 | 202K / 8 | 116K / 4 | 123K / 5 | 123K / 5 |
| **v5** | **73K / 3** | **73K / 3** | **98K / 4** | **73K / 3 (−41%)** |
| complete | | | | 74K / 2 |

**Findings:**
1. Two routing rows (log, quests) fixed it. Rule: **every route or feature area must be reachable from the routing table.**
2. Overall totals moved within noise (on untouched tasks, one arm's three runs varied as much as v4 vs v5). **3 repeats can't resolve ±10% effects**, so report per-task spreads.
3. Even v5 opened code for one undocumented rule (when "Load more" disables). That's answer-completeness again.
4. Honesty point: once a doc change targets a held-out task, it's **no longer held out**.

## Stage 11: v6, can a tool fold many reads into one?

**Intent.** Give agents `tools/read.mjs`: **one call** returns a routing row's docs (`node tools/read.mjs combat`), line ranges (`file.ts:120-180`), or symbols (`file.ts#resolveCombatRound`). It's based on v4, with only `node` allowed in the shell.

| | v4 | v6 |
|---|---|---|
| Input, all 11 | 794K | 915K |
| Runs using the tool | — | 29 / 33 |
| Runs that still read separately afterwards | — | 14 / 33 |
| Context per request | 24.5K | 24.2K |

**Findings:**
1. **Adopted, but no fewer round trips.** Q&A already sat at the **2-round-trip floor** (read once, answer once). v4 agents already read a row in one parallel batch, so fewer *calls* isn't fewer *turns*.
2. The remaining extra turns come from **facts missing in the docs**, and you can only batch reads you already know you need.
3. Shell permission was **looser than configured**: Copilot also ran read-only commands (`cd`, `Select-String`). Nothing was modified, but use a real sandbox if it matters.

**Talking point:** *tools don't fix missing information.*

## Stage 12: Porting the harness to Claude Code

**Intent.** Check that the results aren't Copilot-specific.

**What was built:** `run.mjs --agent claude` drives `claude -p --output-format stream-json`, mapping each arm's meaning onto Claude flags: `--tools Read,Grep,Glob` with `--permission-mode dontAsk` (read-only); `claudeMdExcludes` for no-auto-load arms; `Bash(node *)` for v6; and `--setting-sources project,local`, `--disable-slash-commands`, and `--strict-mcp-config` so personal config, hooks, and skills don't leak in. A new parser maps Claude's events onto the same metrics, with cost in USD.

**Pitfall:** excluding `**/CLAUDE.md` via `claudeMdExcludes` **also suppressed `AGENTS.md`**. The first smoke run's auto-load arms silently ran without their routing table and went straight to the code. A no-tools prompt asking the model to *quote* the routing table caught it.

**Smoke test** (`level-up-flow`, 1 run each):

| Arm | Round trips | Input | Cost |
|---|---|---|---|
| complete | 3 | 25.3K | $0.054 |
| **research-v4** | **2** | **15.9K** | **$0.031** |
| research-v4-noauto | 3 | 23.2K | $0.038 |
| research-v6 | 2 | 26.8K | $0.034 |

**Full run** (`claude-iso-1`: 14 arms × 11 tasks × 3 = 462 runs, `claude-sonnet-5-5`, isolated, 0 failures; sum of per-task medians):

| Arm | Input, all 11 | vs complete | Held-out input | Round trips (orig / held) | Cost (USD) | Context per request |
|---|---|---|---|---|---|---|
| complete | 360K | — | 87K | 30 / 11 | $0.61 | 8.8K |
| complete-guided | 799K | +122% | 187K | 31 / 11 | $1.30 | 17.7K |
| research-v1 | 431K | +20% | 96K | 30 / 12 | $0.70 | 10.1K |
| research-v1-guided | 619K | +72% | 155K | 36 / 13 | $0.89 | 12.9K |
| research-v2 | 292K | −19% | 104K | 21 / 10 | $0.48 | 9.2K |
| **research-v3** | **270K** | **−25%** | 114K | **18 / 11** | **$0.46** | 9.3K |
| research-v4 | 305K | −15% | 95K | 22 / 10 | $0.50 | 9.5K |
| research-v5 | 309K | −14% | 106K | 21 / 10 | $0.52 | 10.1K |
| research-v6 | 492K | +37% | 181K | 22 / 12 | **$0.46** | 14.6K |
| *-noauto arms (v2–v6)* | 370K–612K | +3% to +70% | 109K–210K | 26–27 / 12–13 | $0.61–$0.67 | 9.5K–14.9K |

Median answer score: 1.00 for every arm.

**Findings (Claude Code vs Copilot)**
1. **Same shape, smaller savings.** Auto-loaded routed docs (v2–v5) beat the baseline on Claude too, but by **15–25%** in input and **~20–25%** in cost, against 41–50% on Copilot.
2. **Why smaller: Claude's baseline is already lean.** Unguided, Claude goes `Grep` → `Read` on the right code in about 5 tool calls and 4 round trips, with **~8.8K** of fixed context per request. Copilot's unguided baseline made ~20 tool calls, often through a search subagent, at ~23K per request. There's less waste for docs to remove.
3. **The same failure modes.** "Use the docs" without a routing table is the most expensive option on both agents (`complete-guided` +122%, `v1-guided` +72%). Without auto-load, routed docs only break even (+3% to +18%).
4. **Held-out tasks don't transfer on Claude.** The baseline is cheapest on the 3 held-out tasks (87K); every doc arm is higher (95K–130K). The routing table and flows mostly help the tasks they were written for.
5. **Layout is noise on both.** v3 (docs beside code) beat v4 (`docs/code/`) on Claude, the opposite of Copilot. Treat the layout choice as maintainability, not cost.
6. **Total input tokens can mislead under caching.** v6's shell tool definitions add ~5K of *cached* context to every request, so its total input is the highest of the routed arms. Yet it has the **lowest fresh input (65K) and output (13K)**, and ties v3 for the lowest dollar cost ($0.46). The tool was used in 32 of 33 runs. On cache-priced APIs, report cost (or fresh input) alongside total tokens.


---

## Cross-cutting lessons (one slide each)

1. **Measure round trips, not just tokens.** Tokens ≈ requests × (fixed context + history). Design docs to cut steps.
2. **The entry point is everything.** An auto-loaded routing table beat every other change.
3. **Answer-completeness is the long tail.** Each missing fact costs a turn. Write in the values agents look for, and name where they come from.
4. **Route every area.** Unrouted areas trigger grep loops.
5. **Structure > layout > tooling.** Location didn't matter, and a multi-read tool didn't help.
6. **Instrument the agent, not just the bill.** Event logs explained every surprising average (tool families, subagents, denied paths).
7. **Isolate your experiment.** Repository context leaks in through paths and instruction files.
8. **Respect noise.** 3 repeats resolve big effects, not ±10%. Use held-out tasks, and retire them once you tune for them.
9. **Docs for agents are a code review.** 14 bugs were found, and the workshop was teaching some of them.

## Next steps / open questions

- **Generalization on Claude Code:** routed docs lost on held-out tasks there. Test whether answer-completeness (v7) or broader routing closes that gap.
- **Model comparison** within Claude Code (Haiku / Sonnet / Opus) on the same arms.
- **v7: answer-completeness pass.** Add the facts agents still opened code for (CORS function, end-of-log rule, sell-price math) and measure the remaining turns.
- **New held-out tasks** and **5+ repeats** to tighten estimates.
- **Code-change tasks** (not just Q&A), where line-range tools like `read.mjs` may pay off.
- Apply the pattern to a **large legacy repository**, the scenario that started this.
- SDLC angle (README, Phase 5): use routed docs plus PR diffs to generate test plans.

## Appendix A: Reproducing the numbers

```bash
cd research-work
node scripts/run.mjs --dry-run
```

```bash
node scripts/run.mjs --label iso-1
```

```bash
node scripts/run.mjs --agent claude --label claude-iso-1
```

```bash
node scripts/analyze.mjs results/runs/iso-1
```

Run folders: `full-1` (unisolated baseline), `v2-1` (unisolated), `iso-1` (isolated; all 14 Copilot arms), `claude-iso-1` (isolated; all 14 arms on Claude Code), `claude-smoke`. Each run keeps `meta.json`, `usage.json`, and `metrics.json`; raw event logs are git-ignored.

## Appendix B: Scale of the experiment

| Run | Sessions | Notes |
|---|---|---|
| Probes and smoke tests | ~15 | Copilot and Claude Code |
| `full-1` | 96 | 4 arms × 8 tasks × 3 |
| `v2-1` | 102 | v2 arms + held-out tasks for the original arms |
| `iso-1` | 462 | 14 arms × 11 tasks × 3, isolated (Copilot) |
| `claude-iso-1` | 462 | 14 arms × 11 tasks × 3, isolated (Claude Code) |
| **Total** | **~1,140** | All answers keyword-graded |
