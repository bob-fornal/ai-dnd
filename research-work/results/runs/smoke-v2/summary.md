# Results: smoke-v2

Runs: 1. Values are **medians** across repeats. Deltas are against the `complete` arm. "Est. tokens of files read" is the tool-result size ÷ 4; token totals come from Copilot's usage file.

## Overall (median of per-run values across all tasks)

| Metric | research-v2 |
|---|---|
| Input tokens (total) | 45,660 () |
| Input minus cache reads | 9,761 () |
| Input tokens (main agent) | 45,660 () |
| Input tokens (subagents) | 0 () |
| Output tokens | 871 () |
| Est. tokens of files read | 649 () |
| Est. tokens of docs read | 649 () |
| Est. tokens of code read | 0 () |
| Doc files read | 1 () |
| Code files read | 0 () |
| Tool calls | 1 () |
| Main-agent model requests (round trips) | 2 () |
| Model requests (all agents) | 2 () |
| AI credits | 4.03 () |
| Answer score (0-1) | 1.00 () |

## Input tokens (total) by task

| Task | research-v2 |
|---|---|
| level-up-flow | 45,660 () |

## Main-agent model requests (round trips) by task

| Task | research-v2 |
|---|---|
| level-up-flow | 2 () |

## Est. tokens of files read by task

| Task | research-v2 |
|---|---|
| level-up-flow | 649 () |

## Answer score (0-1) by task

| Task | research-v2 |
|---|---|
| level-up-flow | 1.00 |

## Run conditions

Copilot CLI picks a tool family per session and may delegate searches to a subagent. These differ between runs and can skew comparisons.

| Arm | Runs | `view` toolset | `read_file` toolset | Runs using a subagent |
|---|---|---|---|---|
| research-v2 | 1 | 1 | 0 | 0 |
