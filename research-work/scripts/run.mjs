#!/usr/bin/env node
// Runs every task against every arm with Copilot CLI and stores raw output plus parsed metrics.
//
//   node scripts/run.mjs [--dry-run] [--tasks a,b] [--arms x,y] [--repeats N] [--label name]
//
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, createWriteStream, readdirSync } from 'node:fs';
import path from 'node:path';
import { WORK_DIR, loadJson, parseRun, grade } from './lib.mjs';

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
const runRoot = path.join(WORK_DIR, 'results', 'runs', label);

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

function buildPrompt(arm, task) {
  return [arm.preamble, task.prompt, config.promptSuffix].filter(Boolean).join('\n\n');
}

function runOnce({ arm, task, rep, outDir }) {
  const armDir = path.resolve(WORK_DIR, arm.dir);
  const eventsFile = path.join(outDir, 'events.jsonl');
  const usageFile = path.join(outDir, 'usage.json');
  const prompt = buildPrompt(arm, task);
  const cliArgs = [
    '-C', armDir,
    '-p', prompt,
    '--model', config.model,
    '--reasoning-effort', config.reasoningEffort,
    '--output-format', 'json',
    '--usage-output-file', usageFile,
    ...armCopilotArgs(arm),
  ];
  const { cmd, pre } = copilotCommand();
  if (dryRun) {
    console.log(`[dry-run] ${arm.id} / ${task.id} / rep ${rep}\n  cwd: ${armDir}\n  ${[cmd, ...pre, ...cliArgs].map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}\n`);
    return Promise.resolve(null);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify({ arm, task, rep, prompt, copilotArgs: armCopilotArgs(arm), model: config.model, reasoningEffort: config.reasoningEffort, startedAt: new Date().toISOString() }, null, 2));
  return new Promise((resolve) => {
    const child = spawn(cmd, [...pre, ...cliArgs], { cwd: armDir, windowsHide: true });
    child.stdout.pipe(createWriteStream(eventsFile));
    child.stderr.pipe(createWriteStream(path.join(outDir, 'stderr.txt')));
    const timer = setTimeout(() => child.kill(), config.timeoutSeconds * 1000);
    child.on('close', (code) => {
      clearTimeout(timer);
      const metrics = parseRun({ eventsFile, usageFile, armDir });
      metrics.processExitCode = code;
      metrics.grade = grade(metrics.answer, task.expect);
      writeFileSync(path.join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
      resolve(metrics);
    });
  });
}

const shuffle = (xs) => xs.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x);
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

// Preflight: warn about differences between the arm folders that can skew results.
for (const arm of arms) {
  const dir = path.resolve(WORK_DIR, arm.dir);
  if (!existsSync(dir)) { console.error(`Arm "${arm.id}" folder not found: ${dir}`); process.exit(1); }
  const nm = ['', 'frontend', 'worker'].filter((sub) => existsSync(path.join(dir, sub, 'node_modules')));
  if (nm.length) console.warn(`note: ${arm.id} has node_modules in: ${nm.map((s) => s || '.').join(', ')}`);
}

const total = tasks.length * arms.length * repeats;
console.log(`${dryRun ? 'Dry run' : 'Running'}: ${tasks.length} tasks x ${arms.length} arms x ${repeats} repeats = ${total} Copilot runs (model ${config.model}).`);
if (!dryRun) console.log(`Output: ${runRoot}\n`);

let n = 0;
for (let rep = 1; rep <= repeats; rep++) {
  for (const task of tasks) {
    // Shuffle arm order per task so prompt-cache warmth and time-of-day don't favor one arm.
    for (const arm of shuffle(arms)) {
      n++;
      const outDir = path.join(runRoot, arm.id, task.id, `rep-${rep}`);
      if (!dryRun && existsSync(path.join(outDir, 'metrics.json'))) { console.log(`[${n}/${total}] skip (done) ${arm.id} / ${task.id} / rep ${rep}`); continue; }
      if (!dryRun) process.stdout.write(`[${n}/${total}] ${arm.id} / ${task.id} / rep ${rep} ... `);
      const m = await runOnce({ arm, task, rep, outDir });
      if (m) {
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
