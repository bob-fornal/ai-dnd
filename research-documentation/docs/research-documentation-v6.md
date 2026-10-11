# Research Documentation v6: One Call, Many Reads (`tools/read.mjs`)

**Status:** implemented and measured (`iso-1`, §5). Result: no improvement over v4.
**Folders:** [`research-documentation/implementation-v6/`](../implementation-v6/) (docs + tool), [`research-documentation/work/`](../work/README.md) (arms `research-v6`, `research-v6-noauto`).
**Builds on:** [v4](research-documentation-v4.md), the most efficient version measured (component docs in `docs/code/`). v5's extra routing rows are **not** included, so v6 vs v4 isolates the tool.
**Date:** 2026-10-09

## 1. Idea

Every model round trip resends ~23K+ tokens of context, so cost tracks the **number of sequential steps**, not bytes read. Even with a routing table, an agent often reads its docs in one turn, then the code lines they point to in another, then a second file it only learned about from the first. v6 gives the agent a way to fold several of those reads into **one** tool call.

## 2. What changed from v4

| File | Change |
|---|---|
| `tools/read.mjs` (new, 115 lines, plain Node, read-only) | Prints any mix of targets in one call: an **area key** (every doc in that routing row), a whole file, a **line range** `path:120-180`, a 40-line window `path:120`, or a **symbol** `path#resolveCombatRound` (from the symbol's line to the next symbol, using the `code.md` symbol index). Code lines are numbered and docs printed plain; output is capped at 1,500 lines; paths outside the project are refused |
| `AGENTS.md` | Every routing row starts with a key (`` `combat` ``, `` `level-up` ``, `` `sessions` `` …). Step 1 becomes "read the row in one call: `node tools/read.mjs <key>`, and add other targets to the same call". Step 3 fetches code by range or symbol, several per call. Fallback: parallel reads if the tool can't run |
| `docs/AUTHORING.md` | New §5b: the routing table is the single source of area keys (the tool parses it), keys are stable, and the symbol index must stay current for `#symbol` reads |
| `code.md`, `docs/SETUP.md` | A pointer to the tool; `tools/` in the project tree |

Example: `node tools/read.mjs combat worker/src/routes/log.ts:7-36 worker/src/services/combat.ts#initCombat` returns two docs, a route excerpt, and one function in a single tool result.

## 3. Harness changes

- **Shell permission for v6 only.** All other arms deny the shell. The v6 arms remove `--allow-all-tools` and `--deny-tool=shell`, and add `--allow-tool=shell(node:*)`, intended to let the agent run `node` only. The full run showed Copilot also allows some read-only commands (see §5, finding 4). Writes are still denied, and read tools work without approval. In the smoke test, both runs used `node tools/read.mjs <key>` with no failed calls.
- **Parsing.** `lib.mjs` recognizes `tools/read.mjs` shell calls and splits their output on the `### path` headers, so doc and code tokens are still attributed per file. A new metric, `multiReadCalls`, counts tool uses per run.
- Same isolated `iso-1` conditions as every other arm: own workspace and git root, no `node_modules`, `--disallow-temp-dir`. 11 tasks × 3 repeats per arm.

## 4. What to look for

1. **Round trips vs v4.** Does one call per routing row plus targeted code reads cut steps further?
2. **Adoption.** How many runs use the tool, and do agents put extra targets in the same call? In the smoke test, `cors-origin` read its row with the tool, then still made separate `grep` and `view` calls for the code.
3. **Shell overhead.** The shell tool's definition and outputs add some context to every request; check that per-request context doesn't grow enough to cancel the savings.
4. **Answer scores**, including held-out tasks.

## 5. Results (`iso-1`, 66 v6 runs, same isolated harness)

**All tasks (sum of per-task medians)**

| Arm | Input, original 8 | Input, held-out 3 | Input, all 11 | vs `complete` | Round trips (orig / held) | AI credits |
|---|---|---|---|---|---|---|
| complete | 1,209K | 365K | 1,573K | — | 40 / 11 | 81.0 |
| **research-v4** | **498K** | **296K** | **794K** | **−50%** | **21 / 11** | **56.0** |
| research-v6 | 539K | 375K | 915K | −42% | 23 / 15 | 58.0 |
| research-v4-noauto | 688K | 440K | 1,128K | −28% | 30 / 18 | 65.2 |
| research-v6-noauto | 660K | 418K | 1,078K | −31% | 29 / 17 | 62.3 |

**Per task, v4 vs v6 (median input / round trips)**

| Task | v4 | v6 | v4-noauto | v6-noauto |
|---|---|---|---|---|
| combat-round, inventory-dialog, level-up-flow, starting-gear, session-expiry | 45–47K / 2 | 46–47K / 2 | 66–90K / 3–4 | 67K / 3 |
| ai-fallback | 100K / 4 | 97K / 4 | 145K / 6 | 118K / 5 |
| cors-origin | 93K / 4 | 117K / 5 | 114K / 5 | 115K / 5 |
| rest-endpoint-plan | 76K / 3 | 94K / 4 | 72K / 3 | 92K / 4 |
| local-login *(held out)* | 46K / 2 | 75K / 3 | 68K / 3 | 96K / 4 |
| log-pagination *(held out)* | 123K / 5 | 147K / 6 | 141K / 6 | 149K / 6 |
| shop-sell *(held out)* | 127K / 4 | 154K / 6 | 231K / 9 | 174K / 7 |

**How the tool was used**

| Arm | Runs using `tools/read.mjs` | Calls with extra targets (row + code ranges/symbols) | Runs that still made separate reads afterwards | Context per request |
|---|---|---|---|---|
| research-v6 | 29 / 33 | 9 / 33 | 14 / 33 | 24.2K (v4: 24.5K) |
| research-v6-noauto | 31 / 33 | 12 / 33 | 13 / 33 | 23.5K (v4: 23.5K) |

Answer scores: the median is 1.00 for both arms. Per task, v6 equals or beats v4, with `local-login` at 1.00 for `research-v6-noauto`.

**Findings**
1. **Adopted, but no fewer round trips.** Agents used the tool in 88–94% of runs, yet v6 is **not** cheaper than v4. With auto-load it's ~15% more expensive (915K vs 794K); without, ~4% cheaper (1,078K vs 1,128K). Both gaps are within the run-to-run spread seen in v5.
2. **The floor was already reached.** On 5 of 11 tasks, v4 and v6 tie at **2 round trips**, the minimum for a read-then-answer question (one read turn, one answer turn). v4 agents were already reading a routing row's docs in **one parallel batch**, so one `read.mjs` call just replaces one batch of `view` calls. Fewer *calls* isn't fewer *turns*.
3. **The real extra turns come from missing information, not from how files are read.** In 14 of 33 runs, agents read their row with the tool and then still went to the code with separate `grep`/`view` calls, because the docs didn't hold the detail (the CORS function body, the end-of-log rule, the sell-price math). Packing more targets into one call needs the agent to **know the targets in advance**, which it only does after reading the docs. Only 9–12 of 33 calls did that.
4. **Shell access is cheap, but not as narrow as configured.** Per-request context is unchanged (~24K). Across 66 runs there were 73 shell calls: 62 `node tools/read.mjs …`, 8 `cd <workspace>; node …` (7 succeeded), and 3 `Select-String` searches (all succeeded). So Copilot allowed some read-only commands beyond the `shell(node:*)` rule. All of them read files inside the isolated workspace, and nothing was modified (no `filesModified` in any run). There were 4 failed calls: 2 `grep`s, 1 `cd` compound, and 1 piped `node … | Select-String`. If a stricter sandbox matters, run these arms with Copilot's command sandbox (`copilot help sandbox`) rather than relying on `--allow-tool` alone.

**Conclusion:** a multi-read tool doesn't beat a good routing table plus parallel reads. Once docs are routed, the remaining cost is **answer-completeness**: each detail missing from a doc costs one more turn, however reads are batched. Keep v4 as the most efficient design. The next gains come from putting the facts agents keep looking up into the docs (v3's lesson, confirmed again by v5's `log-pagination` code read). `tools/read.mjs` is still handy for humans and for code-change tasks that need many exact line ranges, but it isn't a token saver for Q&A.

**On Claude Code** (`claude-iso-1`): the tool was used in 32 of 33 runs. The shell tool definitions add ~5K of cached context per request, so total input is the highest of the routed arms (+37% vs `complete`). But fresh input and output are the lowest, and the dollar cost ties v3 for best ($0.46 vs $0.61 for `complete`). On cache-priced APIs the tool is cost-neutral to slightly positive; judge it by cost, not raw token totals.
