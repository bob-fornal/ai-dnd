#!/usr/bin/env node
// Read-only multi-file reader: returns several docs, files, line ranges, or symbols in ONE call,
// so an agent can gather all its context in a single round trip instead of one read per file.
//
//   node tools/read.mjs <target> [<target> ...]
//
// Targets:
//   <area>                 every doc in that AGENTS.md routing row, e.g. `combat`, `level-up`
//   <path>                 a whole file (first 300 lines)
//   <path>:<start>-<end>   a line range, e.g. worker/src/routes/log.ts:7-36
//   <path>:<line>          40 lines starting at <line>
//   <path>#<symbol>        from the symbol's line to the next symbol in that file (code.md symbol index)
//   --list                 print the area keys
//
// Paths are relative to the project root (the folder containing AGENTS.md). Nothing is ever written.
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WHOLE_FILE_LINES = 300;
const LINE_WINDOW = 40;
const TOTAL_LINE_CAP = 1500;

const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Area keys come from the AGENTS.md routing table: the first word(s) of "Working on", slugged,
// plus an explicit `key` in backticks if the row starts with one, e.g. "| `combat` Combat (…) |".
function loadAreas() {
  const areas = new Map();
  for (const line of read('AGENTS.md').split('\n')) {
    const m = line.match(/^\|\s*(?:`([\w-]+)`\s*)?([^|]+?)\s*\|(.+)\|\s*$/);
    if (!m || /^-+$/.test(m[2].trim()) || m[2].trim() === 'Working on') continue;
    const files = [...m[3].matchAll(/\]\(([^)#]+)\)/g)].map((x) => x[1]);
    if (!files.length) continue;
    const key = m[1] ?? slug(m[2].split(/[(,]/)[0]);
    areas.set(key, { label: m[2].trim(), files });
  }
  return areas;
}

// Symbol index from code.md: "- `file` ([doc](…)): `name:12`, `method():40`"
function loadSymbols() {
  const map = new Map();
  if (!existsSync(path.join(ROOT, 'code.md'))) return map;
  for (const line of read('code.md').split('\n')) {
    const m = line.match(/^- `([^`]+)` \(\[doc\]\([^)]*\)\): (.+)$/);
    if (!m) continue;
    const syms = [...m[2].matchAll(/`([\w$]+)(?:\(\))?:(\d+)`/g)].map((x) => ({ name: x[1], line: Number(x[2]) }));
    map.set(m[1], syms.sort((a, b) => a.line - b.line));
  }
  return map;
}

function safePath(rel) {
  const abs = path.resolve(ROOT, rel);
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) throw new Error(`outside the project: ${rel}`);
  if (!existsSync(abs) || !statSync(abs).isFile()) throw new Error(`no such file: ${rel}`);
  return path.relative(ROOT, abs).split(path.sep).join('/');
}

function resolveTarget(t, areas, symbols) {
  if (areas.has(t)) return areas.get(t).files.map((f) => ({ file: f }));
  let m = t.match(/^(.+)#([\w$]+)$/);
  if (m) {
    const file = safePath(m[1]);
    const syms = symbols.get(file) ?? [];
    const i = syms.findIndex((s) => s.name === m[2]);
    if (i < 0) throw new Error(`symbol ${m[2]} not in the code.md index for ${file}`);
    return [{ file, start: syms[i].line, end: syms[i + 1] ? syms[i + 1].line - 1 : undefined }];
  }
  m = t.match(/^(.+):(\d+)(?:-(\d+))?$/);
  if (m) {
    const start = Number(m[2]);
    return [{ file: safePath(m[1]), start, end: m[3] ? Number(m[3]) : start + LINE_WINDOW - 1 }];
  }
  return [{ file: safePath(t) }];
}

const args = process.argv.slice(2);
const areas = loadAreas();
if (!args.length || args.includes('--list') || args.includes('--help')) {
  console.log('Usage: node tools/read.mjs <area | path | path:start-end | path:line | path#symbol> ...\n\nAreas:');
  for (const [k, v] of areas) console.log(`  ${k.padEnd(18)} ${v.label}  →  ${v.files.join(', ')}`);
  process.exit(args.length ? 0 : 1);
}

const symbols = loadSymbols();
const seen = new Set();
let total = 0;
const out = [];
for (const t of args) {
  let specs;
  try { specs = resolveTarget(t, areas, symbols); } catch (e) { out.push(`### ${t}\n(error: ${e.message})\n`); continue; }
  for (const s of specs) {
    const key = `${s.file}:${s.start ?? ''}-${s.end ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const lines = read(s.file).split('\n');
    const start = Math.max(1, s.start ?? 1);
    let end = Math.min(lines.length, s.end ?? (s.start ? lines.length : WHOLE_FILE_LINES));
    if (total + (end - start + 1) > TOTAL_LINE_CAP) end = start + Math.max(0, TOTAL_LINE_CAP - total) - 1;
    const isDoc = s.file.endsWith('.md');
    out.push(`### ${s.file} (lines ${start}-${end} of ${lines.length})`);
    // Docs are printed plain; code gets line numbers so anchors and edits can cite them.
    for (let n = start; n <= end; n++) out.push(isDoc ? lines[n - 1] : `${String(n).padStart(4)}| ${lines[n - 1]}`);
    if (end < lines.length && !s.end) out.push(`… (${lines.length - end} more lines; ask for ${s.file}:${end + 1}-${lines.length})`);
    out.push('');
    total += end - start + 1;
    if (total >= TOTAL_LINE_CAP) { out.push(`(stopped at ${TOTAL_LINE_CAP} lines; request the rest separately)`); break; }
  }
  if (total >= TOTAL_LINE_CAP) break;
}
console.log(out.join('\n'));
