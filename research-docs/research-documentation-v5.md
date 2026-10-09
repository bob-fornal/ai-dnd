# Research Documentation v5: Route Every Area

**Status:** implemented and measured (`iso-1`, §5).
**Folders:** [`research-documentation-v5/`](../research-documentation-v5/) (docs), [`research-work/`](../research-work/README.md) (arms `research-v5`, `research-v5-noauto`).
**Builds on:** [v4](research-documentation-v4.md) (component docs in `docs/code/`), which builds on [v3](research-documentation-v3.md) and [v2](research-documentation-v2.md).
**Date:** 2026-10-09

## 1. The weak spot

In `iso-1`, every v2–v4 arm was slow on the held-out task `log-pagination`. They needed 5–8 round trips and 123K+ input tokens, where `complete` and `research-v1` needed 2 and about 75K.

The event logs show why. The `AGENTS.md` routing table had **no row for the adventure log**, so v4 agents fell back to `grep` loops (`adventure.?log`, then `getLog|loadMore`, then `logPage|logLimit`, …) before finding `routes/log.ts` and `game-console`. Quests had the same gap: `routes/quest.ts` was reachable from no row or flow.

## 2. What changed from v4

| File | Change |
|---|---|
| `AGENTS.md` | Two new routing rows: **Adventure log** (history sidebar, paging, `/api/log`) → `docs/code/worker/src/routes/log.md` + `game-console.component.md`; **Quests** (generate, list, `/api/quest`) → `docs/code/worker/src/routes/quest.md` + `ai-dm.md` |
| `docs/AUTHORING.md` | The rule now requires every flow, feature area, **and every Worker route file** to be reachable from a routing row |
| `docs/SETUP.md` | Folder name |

Everything else is identical to v4 (`diff -rq` shows only those three files). With the new rows, all 8 Worker route files are reachable from the routing table, through their own row or a flow doc.

**This is a deliberately small, single-variable change**, so any difference from v4 comes from routing coverage alone. The component docs weren't edited. For example, the game-console doc still doesn't spell out the "end of log" rule (`logPage × 20 ≥ total`), so an agent may still open code for that detail.

## 3. Caveat: `log-pagination` is no longer held out for v5

The new row was motivated by `log-pagination`'s results, so for v5 that task is now **tuned, not held out**. The fair test of the general rule ("route every area") is:
- `local-login` and `shop-sell`, still held out, which should be unchanged or better.
- The original 8 tasks, which shouldn't get worse (two extra rows add a little fixed context to every request).
- A new set of held-out tasks in a future run, to confirm the rule generalizes.

## 4. Measurement

The arms run in the same isolated `iso-1` harness (own workspace and git root, no `node_modules`, `--disallow-temp-dir`), 11 tasks × 3 repeats each:

| Arm | Docs | Auto-load |
|---|---|---|
| `research-v5` | v5 | yes |
| `research-v5-noauto` | v5 | no; the prompt points at `AGENTS.md` |

```bash
node scripts/analyze.mjs results/runs/iso-1
```

**Caveat:** like v4, the v5 arms ran later than the original eight, so service load and cache state may differ slightly.

## 5. Results (`iso-1`, 66 v5 runs, same isolated harness as the other 10 arms)

Full tables: `research-work/results/runs/iso-1/summary.md`, section "Sum of per-task medians".

**The targeted task: `log-pagination`** (per repeat: input / round trips)

| Arm | rep 1 | rep 2 | rep 3 | Median |
|---|---|---|---|---|
| research-v4 | 202K / 8 | 116K / 4 | 123K / 5 | 123K / 5 |
| **research-v5** | **73K / 3** | **73K / 3** | **98K / 4** | **73K / 3 (−41%)** |
| research-v4-noauto | 140K / 6 | 141K / 6 | 141K / 6 | 141K / 6 |
| research-v5-noauto | 94K / 4 | 119K / 5 | 119K / 5 | 119K / 5 (−16%) |
| complete (baseline) | | | | 74K / 2 |

All three v5 runs beat all three v4 runs. Every v5 run read the two routed docs (`log.md`, `game-console.component.md`) and no grep loop happened. v5 is now level with the baseline on this task, which v2–v4 had lost by +66% to +96%.

**All tasks (sum of per-task medians)**

| Arm | Input, original 8 | Input, held-out 3 | Input, all 11 | vs `complete` | Round trips (orig / held) | AI credits |
|---|---|---|---|---|---|---|
| complete | 1,209K | 365K | 1,573K | — | 40 / 11 | 81.0 |
| research-v4 | 498K | 296K | 794K | −50% | 21 / 11 | 56.0 |
| research-v5 | 530K | 354K | 885K | −44% | 22 / 14 | 58.7 |
| research-v4-noauto | 688K | 440K | 1,128K | −28% | 30 / 18 | 65.2 |
| research-v5-noauto | 711K | 352K | 1,063K | −32% | 31 / 14 | 61.5 |

The median answer score is 1.00 for both v5 arms. Per task, v5 matches v4, except that `shop-sell` went from 0.80 to 1.00.

**Findings**
1. **Routing coverage fixed the weak spot.** `log-pagination` dropped from 123K / 5 round trips to 73K / 3, now on par with `complete`.
2. **No measurable side effects.** On the 8 original tasks, v5 is within ~1% of v4 on 6. The overall totals (v5 885K vs v4 794K with auto-load; 1,063K vs 1,128K without) move in **opposite directions** for the two v5 arms. The differences come from `ai-fallback`, `local-login`, and `shop-sell`, tasks the change didn't touch. On those, one arm's three runs vary as much as v4 and v5 differ (e.g. `shop-sell`: 104K–212K within v4, 123K–212K within v5). That's run-to-run noise at 3 repeats, not a regression.
3. **Docs still leak to code where a detail is missing.** All three v5 runs on `log-pagination` opened `game-console.component.ts`, because the "end of log" rule (`logPage × 20 ≥ total` disables **Load more**) isn't written in any doc. Adding it to the game-console doc should save that read: the same answer-completeness lesson as v3's `starting-gear` fix.

**Conclusion:** give every route or feature area a routing row; it costs about 100 tokens of context and removes the grep fallback. Treat `log-pagination` as tuned for v5. To confirm the rule generalizes, and to get tighter totals, the next run should add **new held-out tasks** and **5+ repeats** (3 repeats can't separate ±10% effects on the noisier tasks).
