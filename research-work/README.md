# Research Work: Documentation Token Usage

This folder measures whether **component-focused documentation** ([`../research-documentation-v1/`](../research-documentation-v1/)) lowers the tokens an AI agent spends gathering context, compared with **document-type documentation** ([`../complete/`](../complete/): one PRD, one setup guide, deployment notes).

It runs the same read-only questions against both folders with the [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli) in non-interactive mode. It records token usage, which files the agent read, and whether the answer was correct.

## Layout

```
research-work/
├── config.json          Model, effort, repeats, Copilot flags, and the arms (folder + prompt preamble)
├── tasks.json           Questions plus expected keywords used to grade each answer (3 marked heldOut)
├── scripts/
│   ├── run.mjs          Runs tasks × arms × repeats with Copilot CLI; saves raw output + metrics
│   ├── analyze.mjs      Aggregates a run folder into summary.md and runs.csv
│   ├── reparse.mjs      Rebuilds metrics.json from saved raw output (no Copilot calls)
│   ├── build-symbol-index.mjs  Regenerates the v2 symbol index (code.md) and Anchors: blocks
│   └── lib.mjs          Parsing, grading, shared helpers
└── results/runs/<label>/<arm>/<task>/rep-N/
    ├── meta.json        Prompt and settings for the run
    ├── events.jsonl     Copilot JSONL event stream (--output-format json); git-ignored
    ├── usage.json       Copilot final usage (--usage-output-file)
    ├── stderr.txt       git-ignored
    └── metrics.json     Parsed metrics + grade
```

## Arms

| Arm | Folder | Prompt preamble |
|---|---|---|
| `complete` | `../complete` | none (baseline) |
| `complete-guided` | `../complete` | use `PRD.md`, `SETUP.md`, `docs/` first |
| `research-v1` | `../research-documentation-v1` | none |
| `research-v1-guided` | `../research-documentation-v1` | read `AGENTS.md` and follow its context-gathering steps (`code.md`, then component docs, then code) |
| `research-v2` | `../research-documentation-v2` | none; `--no-custom-instructions` is **removed** so its `AGENTS.md` routing table auto-loads |
| `research-v2-noauto` | `../research-documentation-v2` | read `AGENTS.md` and follow it (auto-load off), which isolates the auto-load effect |
| `research-v3`, `research-v3-noauto` | `../research-documentation-v3` | as v2: v3 adds a root-relative path statement and named value sources |
| `research-v4`, `research-v4-noauto` | `../research-documentation-v4` | as v2: v4 moves component docs to `docs/code/` with `Code:` links |
| `research-v5`, `research-v5-noauto` | `../research-documentation-v5` | as v2: v5 adds routing rows for the adventure log and quests (`log-pagination` is no longer held out for v5) |
| `research-v6`, `research-v6-noauto` | `../research-documentation-v6` | as v2: v6 = v4 plus `tools/read.mjs`; these arms allow `shell(node:*)` instead of `--allow-all-tools` (writes still denied; Copilot also allowed some read-only commands such as `cd` and `Select-String`) |

The unguided arms show what an agent does on its own. The guided arms show what each documentation style is worth when the agent is pointed at it. Every arm except `research-v2` passes `--no-custom-instructions`, so Copilot does **not** auto-load any `AGENTS.md` (v1's holds authoring rules, and the repository root's holds Angular rules); the only guidance those agents get is the preamble. `research-v2` removes that flag on purpose so its routing-table `AGENTS.md` loads.

**v1/v2 naming.** Arms are tagged with a `docsVersion` (`baseline`, `v1`, `v2`) that appears in `summary.md`. Runs made before the v1 folder rename (for example `results/runs/full-1`) used the arm IDs `research` and `research-guided`, and their v1 guide was still named `AGENT.md`. `armAliases` in `config.json` maps those IDs to `research-v1` and `research-v1-guided`, so old and new runs combine in one report:

```bash
node scripts/analyze.mjs results/runs/full-1 results/runs/v2-1 --out results/combined
```

## Running

Requires Node 18+ and Copilot CLI, signed in (`copilot login`).

```bash
cd research-work
node scripts/run.mjs --dry-run
```

```bash
node scripts/run.mjs --label baseline-1
```

```bash
node scripts/analyze.mjs results/runs/baseline-1
```

Useful options for `run.mjs`:

| Option | Effect |
|---|---|
| `--tasks a,b` | Run only these task IDs |
| `--arms x,y` | Run only these arms |
| `--repeats N` | Override `config.json` repeats |
| `--label name` | Output folder name; re-running the same label **skips finished runs**, so an interrupted batch resumes |

Arms can change the shared Copilot flags with `removeArgs` and `extraArgs` in `config.json`. The v2 design and its measurement plan are in [`../research-docs/research-documentation-v2.md`](../research-docs/research-documentation-v2.md).

**Cost:** the original suite was 8 tasks × 4 arms × 3 repeats = **96 Copilot sessions**; with 11 tasks and 6 arms a full run is 198. In the smoke test each session cost about 5–8 AI credits and one premium request. Use `--tasks`, `--arms`, and `--repeats` to start small.

## Running with Claude Code

The same tasks, arms, isolation, grading, and analysis run against the Claude Code CLI with `--agent claude`:

```bash
node scripts/run.mjs --agent claude --dry-run
```

```bash
node scripts/run.mjs --agent claude --label claude-iso-1
```

```bash
node scripts/analyze.mjs results/runs/claude-iso-1
```

Settings live in the `claude` block of `config.json` (default model `claude-sonnet-5-5`, effort `medium`, tools `Read`, `Grep`, `Glob`). Each arm keeps its meaning:

| Arm property | Copilot | Claude Code |
|---|---|---|
| Read-only | `--allow-all-tools --deny-tool=write --deny-tool=shell` | `--tools Read,Grep,Glob --permission-mode dontAsk` (anything else is denied) |
| Auto-load `AGENTS.md` | remove `--no-custom-instructions` | default (project instructions load) |
| No auto-load | `--no-custom-instructions` | `--settings '{"claudeMdExcludes":["**/AGENTS.md"]}'` |
| Node-only shell (v6) | `--allow-tool=shell(node:*)` | adds `Bash`/`PowerShell` with `--allowedTools "Bash(node *),PowerShell(node *)"` |
| No personal config | `--disable-builtin-mcps`, no user instructions exist | `--setting-sources project,local` (no global `CLAUDE.md`, hooks, or plugins), `--disable-slash-commands`, `--strict-mcp-config`, `--no-session-persistence` |
| Subagents | Copilot may use a search subagent | not available (not in `--tools`) |

Parsing (`parseClaudeRun` in `lib.mjs`) reads `--output-format stream-json --verbose`. Input tokens are the sum of fresh input, cache reads, and cache writes from the final `result.modelUsage`, matching Copilot's figure. Round trips are unique assistant message IDs, and cost comes from `total_cost_usd` (the **Cost in USD** row). `reparse.mjs` picks the parser from `meta.json`.

**Pitfall found while building this:** a `claudeMdExcludes` pattern for `**/CLAUDE.md` also stops `AGENTS.md` from loading, which silently turned the auto-load arms into no-routing arms. The user-level `CLAUDE.md` is excluded with `--setting-sources project,local` instead. Verify with a no-tools prompt that asks the model to quote the routing table.

**Smoke test** (`results/runs/claude-smoke`, `level-up-flow`, 1 run each): `complete` 3 round trips / 25.3K input / $0.054; `research-v4` 2 / 15.9K / $0.031; `research-v4-noauto` 3 / 23.2K / $0.038; `research-v6` 2 / 26.8K / $0.034, using one `tools/read.mjs` call. Claude's fixed context per request (~8K) is much smaller than Copilot's (~23K).

**Full run** (`results/runs/claude-iso-1`, 462 runs, 0 failures): routed auto-load arms beat the baseline by 15–25% in input and ~20–25% in cost (best: v3, 270K vs 360K, $0.46 vs $0.61). That's the same ranking as Copilot with smaller savings, because Claude's unguided baseline is already lean. Guided-without-routing is still the most expensive arm (+122%), and held-out tasks favor the baseline. v6's shell tool raises cached context per request, so its total input is high (+37%) while its dollar cost ties for lowest. Full write-up: `research-docs/agentic-ai-token-usage-talk.md` Stage 12.

## Isolation

By default (`"isolate": true`), `run.mjs` copies each arm folder to `<workspaceRoot>/<label>/<folder>` (default `../../ai-dnd-research-workspaces`, outside this repository and outside the system temp folder) and runs `git init` there. Each arm is then its own project root:

- Relative paths in docs resolve against the arm, not the ai-dnd repository. Before isolation, doc-following arms lost round trips to denied out-of-folder paths (`v2-1`: 27/33 `research-v2` runs).
- Only the arm's own `AGENTS.md` can load as instructions; the repository-root `AGENTS.md` can't.
- No arm has `node_modules`, `dist`, `.angular`, or `.wrangler`.

Copies are made once per label on first use and reused when a run resumes. `meta.json` records `workspaceDir`. Use `--no-isolate` to run in place. Runs before `iso-1` (`full-1`, `v2-1`) weren't isolated, so compare them only with each other.

## What each run is allowed to do

All arms share the flags in `config.json`:

- `--allow-all-tools --deny-tool=write --deny-tool=shell`: the agent can read and search but can't edit files or run shell commands. That keeps runs read-only and makes file reads traceable through tool events.
- `-C <arm folder>` (no `--allow-all-paths`): file access is limited to the arm's folder, so the agent can't see the other folder or the repo-root `bugs.md`.
- `--disable-builtin-mcps`: removes the GitHub MCP server, about 10K tokens of tool definitions that aren't relevant here.
- `--no-custom-instructions --no-ask-user --no-auto-update --no-color --disallow-temp-dir`: keeps runs non-interactive and comparable, and keeps agents out of the temp folder.
- The model and reasoning effort are pinned (`claude-sonnet-5`, `medium`). Arm order is shuffled for each task so prompt-cache warmth doesn't favor one arm.

## Metrics

| Metric | Source | Meaning |
|---|---|---|
| Input tokens (total) | `usage.json` | All input tokens across every model call, including cache reads and writes and subagents. **Primary measure.** |
| Input minus cache reads | `usage.json` | Input that wasn't served from the prompt cache |
| Input tokens (main / subagents) | `usage.json` `agentMetrics` | Split between the main agent and search subagents |
| Output tokens | `usage.json` | Tokens generated |
| AI credits | `usage.json` `totalNanoAiu` ÷ 1e9 | What the run cost |
| Est. tokens of docs / code read | `events.jsonl` tool results | Size of file-read results ÷ 4, split into `.md` docs and code. Shows *where* context came from |
| Doc / code files read | `events.jsonl` | Unique files opened |
| Main-agent model requests | `usage.json` `agentMetrics.main` | **Round trips.** Each one resends the whole context (~23K fixed tokens plus history), so this drives total input more than file size does |
| Tool calls, model requests (all agents) | both | How much searching the agent did |
| Answer score | `tasks.json` `expect` | Share of expected keyword groups found in the final answer. Checks that lower tokens didn't come from a worse answer |

`summary.md` reports **medians** across repeats, with percentage deltas against the `complete` arm.

## Known confounds

Read results with these in mind:

1. **Copilot picks a tool family per session.** Some sessions get `view`/`grep`/`glob`; others get `read_file`/`grep_search`/`file_search`, plus a `search_code_subagent` that runs on a separate search model. The smoke test got one of each. `summary.md` has a **Run conditions** table showing the mix for each arm. With few repeats, this alone can swing results. To remove the subagent, add `"--excluded-tools=search_code_subagent"` to `extraCopilotArgs`.
2. **The code isn't byte-identical.** `research-documentation-v1/` splits Angular components into `.ts`/`.html`/`.css`/`.spec.ts`; `complete/` keeps templates and styles inline. Frontend tasks may read different amounts of code for that reason alone.
3. **`node_modules/`** exists in `complete/` (root, `frontend/`, `worker/`) and in `research-documentation-v1/` (`frontend/`, `worker/`). Both folders gitignore it, and the search tools respect `.gitignore`, but `run.mjs` prints a note when it's present.
4. **Grading is keyword-based.** It catches missing facts, not wrong reasoning. Spot-check answers in `metrics.json` (`answer`).
5. **Repository-level `AGENTS.md`.** The repository root has an `AGENTS.md` (Angular conventions, about 3.3 KB). Copilot loads it as *repository instructions* for any session with custom instructions on. That is only `research-v2`, which therefore carries roughly 800 extra tokens per request that the other arms don't. Check with `copilot instruction list` from inside an arm folder.
6. **Run-to-run variance is large.** Use at least 3 repeats before drawing conclusions.

## Held-out tasks

`log-pagination`, `local-login`, and `shop-sell` cover areas that have **no flow doc in v2**. The v2 flows were written knowing the original 8 tasks, so v2 gains on held-out tasks are the stronger evidence. `summary.md` marks them *(held out)*.

## Smoke test

`results/runs/smoke/` holds one task (`cors-origin`) × two arms × one repeat, run while building the harness. Both answers scored 5/5.

- **`complete`:** used `grep` and read one file, `worker/src/index.ts`. 128,746 input tokens.
- **`research`:** got the `read_file` toolset and a search subagent, and read 6 docs (about 8K tokens: `AGENTS.md`, `PRD.md`, `SETUP.md`, `code.md`, …) plus the same code file. 76,922 input tokens in total, but 32% more AI credits.

One sample per arm can't support a conclusion. It does show why the run-conditions table and repeats matter.
