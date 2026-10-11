# Research: Documentation for AI Agents

Can restructuring a project's documentation for AI agents, rather than for people, reduce the tokens and cost an agent spends to understand a codebase? This folder holds the documentation versions, the test harness, and the write-ups.

| Folder | What's in it |
|---|---|
| [`docs/`](docs/) | Write-ups: [talk shell](docs/agentic-ai-token-usage-talk.md) (every stage, intent, and findings), [next steps](docs/next-steps.md), per-version reports ([v2](docs/research-documentation-v2.md) · [v3](docs/research-documentation-v3.md) · [v4](docs/research-documentation-v4.md) · [v5](docs/research-documentation-v5.md) · [v6](docs/research-documentation-v6.md)), and Bob's background notes ([README](docs/README.md)) |
| [`work/`](work/README.md) | Test harness: tasks, arms, the runner for **GitHub Copilot CLI** and **Claude Code**, parsing, analysis, and all results (`work/results/runs/`) |
| `implementation-v1/` | Copy of `../complete/` with one doc per code file, beside the code, plus a `code.md` index |
| `implementation-v2/` | Auto-loaded `AGENTS.md` routing table, flow docs, generated symbol index and anchors |
| `implementation-v3/` | v2 + paths stated as root-relative + the source named for every value |
| `implementation-v4/` | v3 with component docs moved to `docs/code/`, each linking back to its code |
| `implementation-v5/` | v4 + routing rows for every Worker route area |
| `implementation-v6/` | v4 + `tools/read.mjs`, a read-only multi-target reader |

Every implementation has the same application logic as `../complete/`; only the documentation differs, and earlier versions stay frozen as measured. Known defects are tracked once in [`../bugs.md`](../bugs.md).

**Headline result:** an auto-loaded routing table plus flow docs cut input tokens by ~50% (Copilot) and ~25% (Claude Code) at equal answer quality. Agent cost tracks **round trips**, not document size. Details are in the [talk shell](docs/agentic-ai-token-usage-talk.md).

**Run the tests** (from `work/`):

```bash
node scripts/run.mjs --dry-run
```

```bash
node scripts/run.mjs --agent claude --label my-run
```

```bash
node scripts/analyze.mjs results/runs/my-run
```
