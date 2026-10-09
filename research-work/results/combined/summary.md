# Results: full-1 + v2-1

Runs: 198. Values are **medians** across repeats. Deltas are against the `complete` arm. "Est. tokens of files read" is the tool-result size ÷ 4; token totals come from Copilot's usage file.

## Overall (median of per-run values across all tasks)

| Metric | complete | complete-guided | research-v1 | research-v1-guided | research-v2 | research-v2-noauto |
|---|---|---|---|---|---|---|
| Input tokens (total) | 115,048 | 201,180 (+75%) | 116,808 (+2%) | 239,545 (+108%) | 146,022 (+27%) | 115,349 (+0%) |
| Input minus cache reads | 24,789 | 17,353 (-30%) | 29,518 (+19%) | 19,140 (-23%) | 13,626 (-45%) | 11,416 (-54%) |
| Input tokens (main agent) | 93,179 | 201,180 (+116%) | 94,757 (+2%) | 239,545 (+157%) | 146,022 (+57%) | 115,349 (+24%) |
| Input tokens (subagents) | 25,122 | 0 (-100%) | 27,955 (+11%) | 0 (-100%) | 0 (-100%) | 0 (-100%) |
| Output tokens | 2,051 | 2,222 (+8%) | 2,226 (+9%) | 1,750 (-15%) | 1,377 (-33%) | 1,270 (-38%) |
| Est. tokens of files read | 4,704 | 3,638 (-23%) | 7,338 (+56%) | 5,761 (+22%) | 1,634 (-65%) | 2,083 (-56%) |
| Est. tokens of docs read | 2,675 | 0 (-100%) | 1,958 (-27%) | 4,544 (+70%) | 1,150 (-57%) | 1,822 (-32%) |
| Est. tokens of code read | 3,280 | 3,212 (-2%) | 3,395 (+4%) | 878 (-73%) | 0 (-100%) | 0 (-100%) |
| Doc files read | 1 | 0 (-100%) | 3 (+200%) | 4 (+300%) | 2 (+100%) | 3 (+200%) |
| Code files read | 4 | 2 (-50%) | 3 (-25%) | 1 (-75%) | 0 (-100%) | 0 (-100%) |
| Tool calls | 21 | 14 (-33%) | 22 (+5%) | 11 (-48%) | 6 (-71%) | 6 (-71%) |
| Main-agent model requests (round trips) | 4 | 8 (+100%) | 4 (+0%) | 9 (+125%) | 6 (+50%) | 5 (+25%) |
| Model requests (all agents) | 7 | 8 (+14%) | 6 (-14%) | 9 (+29%) | 6 (-14%) | 5 (-29%) |
| AI credits | 5.91 | 9.42 (+59%) | 6.59 (+11%) | 11.16 (+89%) | 7.26 (+23%) | 6.42 (+9%) |
| Answer score (0-1) | 1.00 | 1.00 (+0%) | 1.00 (+0%) | 1.00 (+0%) | 1.00 (+0%) | 1.00 (+0%) |

## Input tokens (total) by task

| Task | complete | complete-guided | research-v1 | research-v1-guided | research-v2 | research-v2-noauto |
|---|---|---|---|---|---|---|
| ai-fallback | 181,110 | 90,800 (-50%) | 92,608 (-49%) | 151,120 (-17%) | 172,220 (-5%) | 134,078 (-26%) |
| combat-round | 107,925 | 195,067 (+81%) | 87,042 (-19%) | 152,030 (+41%) | 49,540 (-54%) | 132,387 (+23%) |
| cors-origin | 107,460 | 107,640 (+0%) | 74,204 (-31%) | 169,755 (+58%) | 172,531 (+61%) | 180,157 (+68%) |
| inventory-dialog | 65,043 | 164,665 (+153%) | 75,898 (+17%) | 239,545 (+268%) | 145,912 (+124%) | 87,822 (+35%) |
| level-up-flow | 150,486 | 249,588 (+66%) | 196,704 (+31%) | 335,508 (+123%) | 119,723 (-20%) | 109,707 (-27%) |
| local-login *(held out)* | 206,544 | 217,390 (+5%) | 129,856 (-37%) | 151,403 (-27%) | 173,109 (-16%) | 185,599 (-10%) |
| log-pagination *(held out)* | 115,048 | 111,577 (-3%) | 75,271 (-35%) | 284,152 (+147%) | 154,317 (+34%) | 285,867 (+148%) |
| rest-endpoint-plan | 311,536 | 458,032 (+47%) | 383,474 (+23%) | 366,790 (+18%) | 163,696 (-47%) | 111,324 (-64%) |
| session-expiry | 133,598 | 359,171 (+169%) | 173,835 (+30%) | 338,824 (+154%) | 146,421 (+10%) | 111,355 (-17%) |
| shop-sell *(held out)* | 63,336 | 209,186 (+230%) | 76,536 (+21%) | 297,768 (+370%) | 235,563 (+272%) | 302,339 (+377%) |
| starting-gear | 105,828 | 259,519 (+145%) | 234,252 (+121%) | 387,604 (+266%) | 97,009 (-8%) | 88,062 (-17%) |

## Main-agent model requests (round trips) by task

| Task | complete | complete-guided | research-v1 | research-v1-guided | research-v2 | research-v2-noauto |
|---|---|---|---|---|---|---|
| ai-fallback | 6 | 4 (-33%) | 2 (-67%) | 6 (+0%) | 7 (+17%) | 6 (+0%) |
| combat-round | 3 | 8 (+167%) | 2 (-33%) | 6 (+100%) | 2 (-33%) | 6 (+100%) |
| cors-origin | 5 | 5 (+0%) | 2 (-60%) | 7 (+40%) | 7 (+40%) | 8 (+60%) |
| inventory-dialog | 2 | 7 (+250%) | 2 (+0%) | 10 (+400%) | 6 (+200%) | 4 (+100%) |
| level-up-flow | 5 | 10 (+100%) | 6 (+20%) | 12 (+140%) | 5 (+0%) | 5 (+0%) |
| local-login *(held out)* | 6 | 9 (+50%) | 4 (-33%) | 6 (+0%) | 7 (+17%) | 8 (+33%) |
| log-pagination *(held out)* | 4 | 4 (+0%) | 2 (-50%) | 11 (+175%) | 6 (+50%) | 12 (+200%) |
| rest-endpoint-plan | 9 | 13 (+44%) | 13 (+44%) | 12 (+33%) | 6 (-33%) | 5 (-44%) |
| session-expiry | 3 | 13 (+333%) | 4 (+33%) | 13 (+333%) | 6 (+100%) | 5 (+67%) |
| shop-sell *(held out)* | 2 | 9 (+350%) | 2 (+0%) | 11 (+450%) | 9 (+350%) | 12 (+500%) |
| starting-gear | 3 | 11 (+267%) | 7 (+133%) | 14 (+367%) | 4 (+33%) | 4 (+33%) |

## Est. tokens of files read by task

| Task | complete | complete-guided | research-v1 | research-v1-guided | research-v2 | research-v2-noauto |
|---|---|---|---|---|---|---|
| ai-fallback | 5,023 | 3,638 (-28%) | 7,641 (+52%) | 7,790 (+55%) | 3,163 (-37%) | 1,465 (-71%) |
| combat-round | 13,253 | 4,501 (-66%) | 11,116 (-16%) | 6,243 (-53%) | 1,333 (-90%) | 2,118 (-84%) |
| cors-origin | 565 | 565 (+0%) | 1,080 (+91%) | 4,469 (+691%) | 2,166 (+283%) | 1,170 (+107%) |
| inventory-dialog | 3,813 | 2,105 (-45%) | 6,779 (+78%) | 4,216 (+11%) | 1,181 (-69%) | 1,423 (-63%) |
| level-up-flow | 7,085 | 3,426 (-52%) | 13,362 (+89%) | 6,738 (-5%) | 649 (-91%) | 1,434 (-80%) |
| local-login *(held out)* | 7,383 | 4,009 (-46%) | 5,030 (-32%) | 4,751 (-36%) | 1,921 (-74%) | 2,083 (-72%) |
| log-pagination *(held out)* | 1,156 | 973 (-16%) | 1,761 (+52%) | 6,894 (+496%) | 1,803 (+56%) | 2,646 (+129%) |
| rest-endpoint-plan | 14,028 | 12,758 (-9%) | 12,773 (-9%) | 9,405 (-33%) | 5,252 (-63%) | 2,117 (-85%) |
| session-expiry | 4,540 | 4,270 (-6%) | 8,541 (+88%) | 6,091 (+34%) | 590 (-87%) | 1,375 (-70%) |
| shop-sell *(held out)* | 2,752 | 2,875 (+4%) | 2,796 (+2%) | 5,761 (+109%) | 2,165 (-21%) | 3,437 (+25%) |
| starting-gear | 3,503 | 3,212 (-8%) | 7,785 (+122%) | 4,720 (+35%) | 1,176 (-66%) | 1,474 (-58%) |

## Answer score (0-1) by task

| Task | complete | complete-guided | research-v1 | research-v1-guided | research-v2 | research-v2-noauto |
|---|---|---|---|---|---|---|
| ai-fallback | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| combat-round | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| cors-origin | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| inventory-dialog | 0.83 | 0.83 | 0.83 | 1.00 | 1.00 | 1.00 |
| level-up-flow | 0.83 | 0.83 | 1.00 | 0.83 | 1.00 | 1.00 |
| local-login *(held out)* | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| log-pagination *(held out)* | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| rest-endpoint-plan | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| session-expiry | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| shop-sell *(held out)* | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| starting-gear | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0.60 |

## Run conditions

Copilot CLI picks a tool family per session and may delegate searches to a subagent. These differ between runs and can skew comparisons.

| Arm | Docs | Runs | `view` toolset | `read_file` toolset | Runs using a subagent |
|---|---|---|---|---|---|
| complete | baseline | 33 | 4 | 29 | 29 |
| complete-guided | baseline | 33 | 27 | 6 | 6 |
| research-v1 | v1 | 33 | 4 | 29 | 29 |
| research-v1-guided | v1 | 33 | 33 | 0 | 0 |
| research-v2 | v2 | 33 | 31 | 2 | 2 |
| research-v2-noauto | v2 | 33 | 32 | 1 | 1 |
