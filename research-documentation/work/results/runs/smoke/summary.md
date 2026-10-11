# Results: smoke

Runs: 2. Values are **medians** across repeats. Deltas are against the `complete` arm. "Est. tokens of files read" is the tool-result size ÷ 4; token totals come from Copilot's usage file.

## Overall (median of per-run values across all tasks)

| Metric | complete | research |
|---|---|---|
| Input tokens (total) | 128,746 | 76,922 (-40%) |
| Input minus cache reads | 8,954 | 40,900 (+357%) |
| Input tokens (main agent) | 128,746 | 46,980 (-64%) |
| Input tokens (subagents) | 0 | 29,942 () |
| Output tokens | 1,004 | 1,133 (+13%) |
| Est. tokens of files read | 565 | 8,622 (+1426%) |
| Est. tokens of docs read | 0 | 8,027 () |
| Est. tokens of code read | 565 | 595 (+5%) |
| Doc files read | 0 | 6 () |
| Code files read | 1 | 1 (+0%) |
| Tool calls | 5 | 17 (+240%) |
| Main-agent model requests (round trips) | 6 | 2 (-67%) |
| Model requests (all agents) | 6 | 5 (-17%) |
| AI credits | 5.64 | 7.47 (+32%) |
| Answer score (0-1) | 1.00 | 1.00 (+0%) |

## Input tokens (total) by task

| Task | complete | research |
|---|---|---|
| cors-origin | 128,746 | 76,922 (-40%) |

## Main-agent model requests (round trips) by task

| Task | complete | research |
|---|---|---|
| cors-origin | 6 | 2 (-67%) |

## Est. tokens of files read by task

| Task | complete | research |
|---|---|---|
| cors-origin | 565 | 8,622 (+1426%) |

## Answer score (0-1) by task

| Task | complete | research |
|---|---|---|
| cors-origin | 1.00 | 1.00 |

## Run conditions

Copilot CLI picks a tool family per session and may delegate searches to a subagent. These differ between runs and can skew comparisons.

| Arm | Runs | `view` toolset | `read_file` toolset | Runs using a subagent |
|---|---|---|---|---|
| complete | 1 | 1 | 0 | 0 |
| research | 1 | 0 | 1 | 1 |
