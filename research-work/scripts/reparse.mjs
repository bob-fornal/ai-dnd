#!/usr/bin/env node
// Re-parses saved events.jsonl/usage.json into metrics.json (after parser or grading changes). No Copilot calls.
//
//   node scripts/reparse.mjs results/runs/<label>
//
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { WORK_DIR, loadJson, parseRun, parseClaudeRun, grade } from './lib.mjs';

const runRoot = path.resolve(WORK_DIR, process.argv[2] ?? '');
const { tasks } = loadJson('tasks.json');
let count = 0;
for (const arm of readdirSync(runRoot, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const task of readdirSync(path.join(runRoot, arm.name))) {
    for (const rep of readdirSync(path.join(runRoot, arm.name, task))) {
      const dir = path.join(runRoot, arm.name, task, rep);
      const metaFile = path.join(dir, 'meta.json');
      if (!existsSync(metaFile)) continue;
      const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
      // Isolated runs record the workspace they ran in; older runs ran in the arm folder itself.
      const armDir = meta.workspaceDir ?? path.resolve(WORK_DIR, meta.arm.dir);
      const eventsFile = path.join(dir, 'events.jsonl');
      const m = meta.agent === 'claude' ? parseClaudeRun({ eventsFile, armDir }) : parseRun({ eventsFile, usageFile: path.join(dir, 'usage.json'), armDir });
      const expect = tasks.find((t) => t.id === task)?.expect ?? meta.task.expect;
      m.grade = grade(m.answer, expect);
      writeFileSync(path.join(dir, 'metrics.json'), JSON.stringify(m, null, 2));
      count++;
    }
  }
}
console.log(`Re-parsed ${count} run(s) in ${runRoot}`);
