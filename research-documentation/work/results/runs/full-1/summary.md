# Results: full-1

Runs: 96. Values are **medians** across repeats. Deltas are against the `complete` arm. "Est. tokens of files read" is the tool-result size ÷ 4; token totals come from Copilot's usage file.

## Overall (median of per-run values across all tasks)

| Metric | complete | complete-guided | research-v1 | research-v1-guided |
|---|---|---|---|---|
| Input tokens (total) | 108,424 | 201,425 (+86%) | 137,616 (+27%) | 232,730 (+115%) |
| Input minus cache reads | 24,914 | 17,856 (-28%) | 30,573 (+23%) | 19,990 (-20%) |
| Input tokens (main agent) | 92,827 | 201,425 (+117%) | 108,466 (+17%) | 232,730 (+151%) |
| Input tokens (subagents) | 25,346 | 0 (-100%) | 32,577 (+29%) | 0 (-100%) |
| Output tokens | 1,980 | 2,365 (+19%) | 2,281 (+15%) | 1,716 (-13%) |
| Est. tokens of files read | 4,918 | 3,680 (-25%) | 8,582 (+74%) | 6,167 (+25%) |
| Est. tokens of docs read | 2,675 | 0 (-100%) | 3,661 (+37%) | 5,002 (+87%) |
| Est. tokens of code read | 3,594 | 3,661 (+2%) | 3,915 (+9%) | 565 (-84%) |
| Doc files read | 1 | 0 (-100%) | 3 (+200%) | 5 (+350%) |
| Code files read | 5 | 3 (-33%) | 3 (-33%) | 1 (-78%) |
| Tool calls | 20 | 14 (-28%) | 21 (+8%) | 11 (-44%) |
| Main-agent model requests (round trips) | 4 | 8 (+100%) | 4 (+0%) | 9 (+125%) |
| Model requests (all agents) | 7 | 8 (+23%) | 7 (+0%) | 9 (+38%) |
| AI credits | 6.18 | 10.32 (+67%) | 6.75 (+9%) | 10.69 (+73%) |
| Answer score (0-1) | 1.00 | 1.00 (+0%) | 1.00 (+0%) | 1.00 (+0%) |

## Input tokens (total) by task

| Task | complete | complete-guided | research-v1 | research-v1-guided |
|---|---|---|---|---|
| ai-fallback | 181,110 | 90,800 (-50%) | 92,608 (-49%) | 151,120 (-17%) |
| combat-round | 107,925 | 195,067 (+81%) | 87,042 (-19%) | 152,030 (+41%) |
| cors-origin | 107,460 | 107,640 (+0%) | 74,204 (-31%) | 169,755 (+58%) |
| inventory-dialog | 65,043 | 164,665 (+153%) | 75,898 (+17%) | 239,545 (+268%) |
| level-up-flow | 150,486 | 249,588 (+66%) | 196,704 (+31%) | 335,508 (+123%) |
| rest-endpoint-plan | 311,536 | 458,032 (+47%) | 383,474 (+23%) | 366,790 (+18%) |
| session-expiry | 133,598 | 359,171 (+169%) | 173,835 (+30%) | 338,824 (+154%) |
| starting-gear | 105,828 | 259,519 (+145%) | 234,252 (+121%) | 387,604 (+266%) |

## Main-agent model requests (round trips) by task

| Task | complete | complete-guided | research-v1 | research-v1-guided |
|---|---|---|---|---|
| ai-fallback | 6 | 4 (-33%) | 2 (-67%) | 6 (+0%) |
| combat-round | 3 | 8 (+167%) | 2 (-33%) | 6 (+100%) |
| cors-origin | 5 | 5 (+0%) | 2 (-60%) | 7 (+40%) |
| inventory-dialog | 2 | 7 (+250%) | 2 (+0%) | 10 (+400%) |
| level-up-flow | 5 | 10 (+100%) | 6 (+20%) | 12 (+140%) |
| rest-endpoint-plan | 9 | 13 (+44%) | 13 (+44%) | 12 (+33%) |
| session-expiry | 3 | 13 (+333%) | 4 (+33%) | 13 (+333%) |
| starting-gear | 3 | 11 (+267%) | 7 (+133%) | 14 (+367%) |

## Est. tokens of files read by task

| Task | complete | complete-guided | research-v1 | research-v1-guided |
|---|---|---|---|---|
| ai-fallback | 5,023 | 3,638 (-28%) | 7,641 (+52%) | 7,790 (+55%) |
| combat-round | 13,253 | 4,501 (-66%) | 11,116 (-16%) | 6,243 (-53%) |
| cors-origin | 565 | 565 (+0%) | 1,080 (+91%) | 4,469 (+691%) |
| inventory-dialog | 3,813 | 2,105 (-45%) | 6,779 (+78%) | 4,216 (+11%) |
| level-up-flow | 7,085 | 3,426 (-52%) | 13,362 (+89%) | 6,738 (-5%) |
| rest-endpoint-plan | 14,028 | 12,758 (-9%) | 12,773 (-9%) | 9,405 (-33%) |
| session-expiry | 4,540 | 4,270 (-6%) | 8,541 (+88%) | 6,091 (+34%) |
| starting-gear | 3,503 | 3,212 (-8%) | 7,785 (+122%) | 4,720 (+35%) |

## Answer score (0-1) by task

| Task | complete | complete-guided | research-v1 | research-v1-guided |
|---|---|---|---|---|
| ai-fallback | 0.80 | 0.80 | 0.80 | 0.80 |
| combat-round | 1.00 | 1.00 | 1.00 | 1.00 |
| cors-origin | 1.00 | 1.00 | 1.00 | 1.00 |
| inventory-dialog | 0.83 | 0.83 | 0.83 | 1.00 |
| level-up-flow | 0.83 | 0.83 | 1.00 | 0.83 |
| rest-endpoint-plan | 1.00 | 1.00 | 1.00 | 1.00 |
| session-expiry | 1.00 | 1.00 | 1.00 | 1.00 |
| starting-gear | 1.00 | 1.00 | 1.00 | 1.00 |

## Run conditions

Copilot CLI picks a tool family per session and may delegate searches to a subagent. These differ between runs and can skew comparisons.

| Arm | Docs | Runs | `view` toolset | `read_file` toolset | Runs using a subagent |
|---|---|---|---|---|---|
| complete | baseline | 24 | 4 | 20 | 20 |
| complete-guided | baseline | 24 | 21 | 3 | 3 |
| research-v1 | v1 | 24 | 4 | 20 | 20 |
| research-v1-guided | v1 | 24 | 24 | 0 | 0 |
