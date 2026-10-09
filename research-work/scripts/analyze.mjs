#!/usr/bin/env node
// Aggregates one or more results/runs/<label> folders into runs.csv and summary.md (medians per arm and task).
// Pass several folders to combine runs, e.g. the v1 baseline plus v2 runs.
//
//   node scripts/analyze.mjs results/runs/<label> [more run folders…] [--out <dir>] [--baseline complete]
//
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { WORK_DIR, median, loadJson } from './lib.mjs';

const config = loadJson('config.json');
// Held-out tasks have no flow doc written for them; they check that v2 gains aren't overfitted to the original tasks.
const HELD_OUT = new Set(loadJson('tasks.json').tasks.filter((t) => t.heldOut).map((t) => t.id));
// Old arm folder names (from runs made before arms were renamed) map to current arm IDs.
const ALIASES = config.armAliases ?? {};
const DOCS_VERSION = Object.fromEntries(config.arms.map((a) => [a.id, a.docsVersion ?? '']));

const args = process.argv.slice(2);
const optValue = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
// Positional args are run folders; skip each --flag and the value after it.
const runRoots = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) { i++; continue; }
  runRoots.push(path.resolve(WORK_DIR, args[i]));
}
const baseline = optValue('baseline') ?? 'complete';
if (!runRoots.length || runRoots.some((r) => !existsSync(r) || !statSync(r).isDirectory())) {
  console.error('Usage: node scripts/analyze.mjs results/runs/<label> [more…] [--out <dir>] [--baseline <armId>]');
  process.exit(1);
}
// One folder: write the summary into it. Several: write to --out (default results/combined).
const outDir = path.resolve(WORK_DIR, optValue('out') ?? (runRoots.length === 1 ? runRoots[0] : 'results/combined'));
mkdirSync(outDir, { recursive: true });

const rows = [];
for (const runRoot of runRoots) for (const armDir of readdirSync(runRoot)) {
  const armPath = path.join(runRoot, armDir);
  if (!statSync(armPath).isDirectory()) continue;
  const arm = ALIASES[armDir] ?? armDir;
  for (const task of readdirSync(armPath)) {
    for (const rep of readdirSync(path.join(armPath, task))) {
      const f = path.join(armPath, task, rep, 'metrics.json');
      if (!existsSync(f)) continue;
      const m = JSON.parse(readFileSync(f, 'utf8'));
      rows.push({
        arm, docsVersion: DOCS_VERSION[arm] ?? '', run: path.basename(runRoot), task, rep,
        inputTokens: m.inputTokens, outputTokens: m.outputTokens,
        freshInputTokens: m.inputTokens - m.cacheReadTokens,
        cacheReadTokens: m.cacheReadTokens, cacheWriteTokens: m.cacheWriteTokens,
        mainInputTokens: m.mainInputTokens, mainRequests: m.mainRequests, subagentInputTokens: m.subagentInputTokens, subagentRuns: m.subagentRuns,
        toolset: m.toolset,
        modelRequests: m.modelRequests, aiCredits: m.aiCredits,
        toolCalls: m.toolCalls, failedToolCalls: m.failedToolCalls,
        docFilesRead: m.docFilesRead, codeFilesRead: m.codeFilesRead,
        docTokensRead: m.docTokensRead, codeTokensRead: m.codeTokensRead,
        readTokens: m.docTokensRead + m.codeTokensRead,
        score: m.grade?.score ?? 0, missing: (m.grade?.missing ?? []).join('|'),
        filesModified: m.filesModified.length,
        topFiles: m.filesRead.slice(0, 5).map((x) => `${x.path}(${x.tokens})`).join(' '),
      });
    }
  }
}
if (!rows.length) { console.error('No metrics.json files found.'); process.exit(1); }

const cols = Object.keys(rows[0]);
const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(','))].join('\n');
writeFileSync(path.join(outDir, 'runs.csv'), csv);

const METRICS = [
  ['inputTokens', 'Input tokens (total)'],
  ['freshInputTokens', 'Input minus cache reads'],
  ['mainInputTokens', 'Input tokens (main agent)'],
  ['subagentInputTokens', 'Input tokens (subagents)'],
  ['outputTokens', 'Output tokens'],
  ['readTokens', 'Est. tokens of files read'],
  ['docTokensRead', 'Est. tokens of docs read'],
  ['codeTokensRead', 'Est. tokens of code read'],
  ['docFilesRead', 'Doc files read'],
  ['codeFilesRead', 'Code files read'],
  ['toolCalls', 'Tool calls'],
  ['mainRequests', 'Main-agent model requests (round trips)'],
  ['modelRequests', 'Model requests (all agents)'],
  ['aiCredits', 'AI credits'],
  ['score', 'Answer score (0-1)'],
];

const arms = [...new Set(rows.map((r) => r.arm))].sort((a, b) => (a === baseline ? -1 : b === baseline ? 1 : a.localeCompare(b)));
const tasks = [...new Set(rows.map((r) => r.task))].sort();
const fmt = (v, key) => (!Number.isFinite(v) ? '–' : key === 'score' ? v.toFixed(2) : key === 'aiCredits' ? v.toFixed(2) : Math.round(v).toLocaleString('en-US'));
const delta = (v, b) => (Number.isFinite(v) && Number.isFinite(b) && b !== 0 ? `${v >= b ? '+' : ''}${(((v - b) / b) * 100).toFixed(0)}%` : '');
const med = (filter, key) => median(rows.filter(filter).map((r) => r[key]));

let md = `# Results: ${runRoots.map((r) => path.basename(r)).join(' + ')}\n\n`;
md += `Runs: ${rows.length}. Values are **medians** across repeats. Deltas are against the \`${baseline}\` arm. "Est. tokens of files read" is the tool-result size ÷ 4; token totals come from Copilot's usage file.\n\n`;
md += `## Overall (median of per-run values across all tasks)\n\n| Metric | ${arms.join(' | ')} |\n|---|${arms.map(() => '---').join('|')}|\n`;
for (const [key, name] of METRICS) {
  const b = med((r) => r.arm === baseline, key);
  md += `| ${name} | ${arms.map((a) => { const v = med((r) => r.arm === a, key); return a === baseline ? fmt(v, key) : `${fmt(v, key)} (${delta(v, b)})`; }).join(' | ')} |\n`;
}

for (const key of ['inputTokens', 'mainRequests', 'readTokens', 'score']) {
  const name = METRICS.find(([k]) => k === key)[1];
  md += `\n## ${name} by task\n\n| Task | ${arms.join(' | ')} |\n|---|${arms.map(() => '---').join('|')}|\n`;
  for (const t of tasks) {
    const b = med((r) => r.arm === baseline && r.task === t, key);
    md += `| ${t}${HELD_OUT.has(t) ? ' *(held out)*' : ''} | ${arms.map((a) => { const v = med((r) => r.arm === a && r.task === t, key); return a === baseline || key === 'score' ? fmt(v, key) : `${fmt(v, key)} (${delta(v, b)})`; }).join(' | ')} |\n`;
  }
}

md += `\n## Run conditions\n\nCopilot CLI picks a tool family per session and may delegate searches to a subagent. These differ between runs and can skew comparisons.\n\n| Arm | Docs | Runs | \`view\` toolset | \`read_file\` toolset | Runs using a subagent |\n|---|---|---|---|---|---|\n`;
for (const a of arms) {
  const rs = rows.filter((r) => r.arm === a);
  md += `| ${a} | ${DOCS_VERSION[a] || '–'} | ${rs.length} | ${rs.filter((r) => r.toolset === 'view').length} | ${rs.filter((r) => r.toolset === 'read_file').length} | ${rs.filter((r) => r.subagentRuns > 0).length} |\n`;
}

const warnings = rows.filter((r) => r.filesModified > 0 || r.inputTokens === 0);
if (warnings.length) {
  md += `\n## Warnings\n\n${warnings.map((r) => `- ${r.arm}/${r.task}/${r.rep}: ${r.inputTokens === 0 ? 'no usage recorded (failed run?)' : `${r.filesModified} file(s) modified`}`).join('\n')}\n`;
}
writeFileSync(path.join(outDir, 'summary.md'), md);
console.log(md);
console.log(`Wrote ${path.join(outDir, 'summary.md')} and runs.csv`);
