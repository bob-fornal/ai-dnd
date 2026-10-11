#!/usr/bin/env node
// Runs every task against every arm with Copilot CLI and stores raw output plus parsed metrics.
//
//   node scripts/run.mjs [--agent copilot|claude] [--dry-run] [--tasks a,b] [--arms x,y] [--repeats N] [--label name] [--no-isolate]
//
// By default each arm folder is copied into its own isolated workspace (outside this repository, with its
// own `git init`) so relative paths in docs resolve against the arm's root and no repository-level
// instructions leak in. See README "Isolation".
//
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, createWriteStream, readdirSync, readFileSync, cpSync } from 'node:fs';
import path from 'node:path';
import { WORK_DIR, loadJson, parseRun, parseClaudeRun, grade } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };

const config = loadJson('config.json');
const { tasks: allTasks } = loadJson('tasks.json');
const pick = (list, csv) => (csv ? list.filter((x) => csv.split(',').includes(x.id)) : list);
const tasks = pick(allTasks, opt('tasks'));
const arms = pick(config.arms, opt('arms'));
const repeats = Number(opt('repeats') ?? config.repeats);
const dryRun = flag('dry-run');
const label = opt('label') ?? new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const agent = opt('agent') ?? config.agent ?? 'copilot';
if (!['copilot', 'claude'].includes(agent)) { console.error(`Unknown --agent ${agent}`); process.exit(1); }
const runRoot = path.join(WORK_DIR, 'results', 'runs', label);
const isolate = !flag('no-isolate') && config.isolate !== false;
const workspaceRoot = path.resolve(WORK_DIR, config.workspaceRoot ?? '../../ai-dnd-research-workspaces', label);
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.angular', '.wrangler', '.git']);

// One pristine copy per arm folder per label (arms sharing a folder share it). Created once; reused on resume.
const workspaces = new Map();
function workspaceFor(arm) {
  const source = path.resolve(WORK_DIR, arm.dir);
  if (!isolate) return source;
  if (workspaces.has(source)) return workspaces.get(source);
  const dest = path.join(workspaceRoot, path.basename(source));
  if (!dryRun && !existsSync(dest)) {
    cpSync(source, dest, { recursive: true, filter: (src) => !EXCLUDE_DIRS.has(path.basename(src)) });
    execFileSync('git', ['init', '-q'], { cwd: dest });
  }
  workspaces.set(source, dest);
  return dest;
}

// Launch Copilot through node + npm-loader.js on Windows so prompts need no shell quoting.
function copilotCommand() {
  if (config.copilotLoader) return { cmd: process.execPath, pre: [path.resolve(WORK_DIR, config.copilotLoader)] };
  if (process.platform === 'win32') {
    const loader = path.join(path.dirname(process.execPath), 'node_modules', '@github', 'copilot', 'npm-loader.js');
    if (existsSync(loader)) return { cmd: process.execPath, pre: [loader] };
  }
  return { cmd: 'copilot', pre: [] };
}

// Shared flags, minus any the arm removes (e.g. --no-custom-instructions so AGENTS.md auto-loads), plus arm extras.
function armCopilotArgs(arm) {
  const remove = new Set(arm.removeArgs ?? []);
  return [...config.extraCopilotArgs.filter((a) => !remove.has(a)), ...(arm.extraArgs ?? [])];
}

// Claude Code: map each arm's meaning (auto-load instructions? node-only shell?) onto Claude CLI flags.
//   auto-load    = the arm removes --no-custom-instructions (Copilot) → keep AGENTS.md; otherwise exclude it.
//   node shell   = the arm allows shell(node:*) (v6) → add Bash/PowerShell limited to `node …`.
// Every Claude arm skips user-level settings and memory (`--setting-sources project,local`: no global CLAUDE.md, hooks,
// or plugins), skills, and MCP. Note: a `claudeMdExcludes` pattern for CLAUDE.md also suppresses AGENTS.md, so the
// user file is excluded via setting sources instead, and only no-auto-load arms pass an AGENTS.md exclude.
function claudeArgs(arm) {
  const c = config.claude ?? {};
  const autoload = (arm.removeArgs ?? []).includes('--no-custom-instructions');
  const nodeShell = (arm.extraArgs ?? []).some((a) => a.includes('shell(node'));
  const tools = [...(c.tools ?? ['Read', 'Grep', 'Glob']), ...(nodeShell ? ['Bash', 'PowerShell'] : [])];
  const excludes = autoload ? [] : ['**/AGENTS.md'];
  return [
    '--model', c.model ?? 'sonnet',
    ...(c.effort ? ['--effort', c.effort] : []),
    '--tools', tools.join(','),
    ...(nodeShell ? ['--allowedTools', 'Bash(node *),PowerShell(node *)'] : []),
    '--permission-mode', 'dontAsk',
    '--no-session-persistence', '--strict-mcp-config', '--disable-slash-commands',
    '--setting-sources', 'project,local',
    ...(excludes.length ? ['--settings', JSON.stringify({ claudeMdExcludes: excludes })] : []),
    '--output-format', 'stream-json', '--verbose',
    ...(c.extraArgs ?? []),
  ];
}

function buildPrompt(arm, task) {
  return [arm.preamble, task.prompt, config.promptSuffix].filter(Boolean).join('\n\n');
}

function runOnce({ arm, task, rep, outDir }) {
  const armDir = workspaceFor(arm);
  const eventsFile = path.join(outDir, 'events.jsonl');
  const usageFile = path.join(outDir, 'usage.json');
  const prompt = buildPrompt(arm, task);
  const cliArgs = agent === 'claude'
    ? ['-p', prompt, ...claudeArgs(arm)]
    : [
      '-C', armDir,
      '-p', prompt,
      '--model', config.model,
      '--reasoning-effort', config.reasoningEffort,
      '--output-format', 'json',
      '--usage-output-file', usageFile,
      ...armCopilotArgs(arm),
    ];
  const { cmd, pre } = agent === 'claude' ? { cmd: config.claude?.command ?? 'claude', pre: [] } : copilotCommand();
  if (dryRun) {
    console.log(`[dry-run] ${arm.id} / ${task.id} / rep ${rep}\n  cwd: ${armDir}\n  ${[cmd, ...pre, ...cliArgs].map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}\n`);
    return Promise.resolve(null);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify({ agent, arm, task, rep, prompt, workspaceDir: armDir, isolated: isolate, cliArgs: cliArgs.filter((a) => a !== prompt), model: agent === 'claude' ? config.claude?.model : config.model, reasoningEffort: agent === 'claude' ? config.claude?.effort : config.reasoningEffort, startedAt: new Date().toISOString() }, null, 2));
  return new Promise((resolve) => {
    const child = spawn(cmd, [...pre, ...cliArgs], { cwd: armDir, windowsHide: true });
    child.stdout.pipe(createWriteStream(eventsFile));
    child.stderr.pipe(createWriteStream(path.join(outDir, 'stderr.txt')));
    const timer = setTimeout(() => child.kill(), config.timeoutSeconds * 1000);
    child.on('close', (code) => {
      clearTimeout(timer);
      const metrics = agent === 'claude' ? parseClaudeRun({ eventsFile, armDir }) : parseRun({ eventsFile, usageFile, armDir });
      metrics.processExitCode = code;
      metrics.grade = grade(metrics.answer, task.expect);
      writeFileSync(path.join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
      resolve(metrics);
    });
  });
}

const shuffle = (xs) => xs.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x);
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

// Preflight: arm folders must exist. Isolated workspaces leave out node_modules for every arm (parity).
for (const arm of arms) {
  const dir = path.resolve(WORK_DIR, arm.dir);
  if (!existsSync(dir)) { console.error(`Arm "${arm.id}" folder not found: ${dir}`); process.exit(1); }
  if (!isolate) {
    const nm = ['', 'frontend', 'worker'].filter((sub) => existsSync(path.join(dir, sub, 'node_modules')));
    if (nm.length) console.warn(`note: ${arm.id} has node_modules in: ${nm.map((s) => s || '.').join(', ')}`);
  }
}
if (isolate) console.log(`Isolated workspaces: ${workspaceRoot}`);

const total = tasks.length * arms.length * repeats;
console.log(`${dryRun ? 'Dry run' : 'Running'} (${agent}): ${tasks.length} tasks x ${arms.length} arms x ${repeats} repeats = ${total} runs (model ${agent === 'claude' ? config.claude?.model : config.model}).`);
if (!dryRun) console.log(`Output: ${runRoot}\n`);

let n = 0;
let failures = 0;
for (let rep = 1; rep <= repeats; rep++) {
  for (const task of tasks) {
    // Shuffle arm order per task so prompt-cache warmth and time-of-day don't favor one arm.
    for (const arm of shuffle(arms)) {
      n++;
      const outDir = path.join(runRoot, arm.id, task.id, `rep-${rep}`);
      // A run counts as done only if it recorded usage; failed runs (rate limit, auth, crash) are retried on resume.
      const doneFile = path.join(outDir, 'metrics.json');
      if (!dryRun && existsSync(doneFile) && (JSON.parse(readFileSync(doneFile, 'utf8')).inputTokens ?? 0) > 0) { console.log(`[${n}/${total}] skip (done) ${arm.id} / ${task.id} / rep ${rep}`); continue; }
      if (!dryRun) process.stdout.write(`[${n}/${total}] ${arm.id} / ${task.id} / rep ${rep} ... `);
      const m = await runOnce({ arm, task, rep, outDir });
      if (m) {
        if (!m.inputTokens) {
          failures++;
          console.log(`FAILED (no usage recorded; see ${path.relative(WORK_DIR, outDir)}/stderr.txt)`);
          if (failures >= 3) { console.error('\nStopping after 3 consecutive failed runs (rate limit or auth?). Re-run the same command to resume.'); process.exit(2); }
          continue;
        }
        failures = 0;
        console.log(`in ${m.inputTokens} out ${m.outputTokens} docs ${m.docFilesRead} code ${m.codeFilesRead} score ${m.grade.passed}/${m.grade.total}${m.filesModified.length ? '  WARNING: files modified!' : ''}`);
        if (config.cooldownSeconds) await sleep(config.cooldownSeconds);
      }
    }
  }
}

if (!dryRun) {
  console.log(`\nDone. Summarize with:\n  node scripts/analyze.mjs ${path.relative(WORK_DIR, runRoot).split(path.sep).join('/')}`);
  if (!readdirSync(runRoot).length) console.warn('No runs were written.');
}
