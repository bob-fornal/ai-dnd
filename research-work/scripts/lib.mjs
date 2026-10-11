// Shared helpers: load settings, parse one Copilot CLI run into metrics, grade answers.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WORK_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadJson(file) {
  return JSON.parse(readFileSync(path.resolve(WORK_DIR, file), 'utf8'));
}

// Rough token estimate for tool results (Copilot does not report per-tool tokens).
export const estimateTokens = (chars) => Math.round(chars / 4);

const READ_TOOLS = new Set(['view', 'read_file', 'read']);
const DOC_EXT = new Set(['.md']);
const CODE_EXT = new Set(['.ts', '.html', '.css', '.scss', '.sql', '.json', '.toml']);

export function classify(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  if (DOC_EXT.has(ext)) return 'doc';
  if (CODE_EXT.has(ext)) return 'code';
  return 'other';
}

function toRelative(p, armDir) {
  if (!p) return '';
  const abs = path.resolve(armDir, p);
  const rel = path.relative(armDir, abs);
  return rel.split(path.sep).join('/');
}

/**
 * Turn events.jsonl + usage.json from one run into a flat metrics object.
 * Token totals come from usage.json (authoritative). Per-file reads are estimated from tool results.
 */
export function parseRun({ eventsFile, usageFile, armDir }) {
  const m = {
    inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, reasoningTokens: 0,
    modelRequests: 0, premiumRequests: 0, aiCredits: 0, apiDurationMs: 0,
    mainInputTokens: 0, mainRequests: 0, subagentInputTokens: 0, subagentRuns: 0, models: [],
    toolCalls: 0, toolCallsByName: {}, failedToolCalls: 0, toolset: '', multiReadCalls: 0,
    filesRead: [], docFilesRead: 0, codeFilesRead: 0,
    docTokensRead: 0, codeTokensRead: 0, otherToolTokens: 0,
    filesModified: [], answer: '', exitCode: null,
  };

  if (existsSync(usageFile)) {
    const u = JSON.parse(readFileSync(usageFile, 'utf8'));
    for (const mm of Object.values(u.modelMetrics ?? {})) {
      m.inputTokens += mm.usage?.inputTokens ?? 0;
      m.outputTokens += mm.usage?.outputTokens ?? 0;
      m.cacheReadTokens += mm.usage?.cacheReadTokens ?? 0;
      m.cacheWriteTokens += mm.usage?.cacheWriteTokens ?? 0;
      m.reasoningTokens += mm.usage?.reasoningTokens ?? 0;
      m.modelRequests += mm.requests?.count ?? 0;
    }
    m.models = Object.keys(u.modelMetrics ?? {});
    // agentMetrics splits usage between the main agent and any subagents (e.g. a code-search subagent).
    for (const [agent, a] of Object.entries(u.agentMetrics ?? {})) {
      const input = Object.values(a.modelMetrics ?? {}).reduce((s, x) => s + (x.usage?.inputTokens ?? 0), 0);
      if (agent === 'main') {
        m.mainInputTokens += input;
        m.mainRequests += Object.values(a.modelMetrics ?? {}).reduce((s, x) => s + (x.requests?.count ?? 0), 0);
      }
      else { m.subagentInputTokens += input; m.subagentRuns++; }
    }
    m.premiumRequests = u.totalPremiumRequestCost ?? 0;
    m.aiCredits = (u.totalNanoAiu ?? 0) / 1e9;
    m.apiDurationMs = u.totalApiDurationMs ?? 0;
    m.filesModified = u.codeChanges?.filesModified ?? [];
  }

  if (!existsSync(eventsFile)) return m;
  const starts = new Map();
  const reads = new Map(); // relPath -> estimated tokens (max seen)
  for (const line of readFileSync(eventsFile, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    const d = e.data ?? {};
    if (e.type === 'tool.execution_start') {
      starts.set(d.toolCallId, { name: d.toolName, args: d.arguments ?? {} });
      m.toolCalls++;
      m.toolCallsByName[d.toolName] = (m.toolCallsByName[d.toolName] ?? 0) + 1;
    } else if (e.type === 'tool.execution_complete') {
      const s = starts.get(d.toolCallId) ?? { name: '?', args: {} };
      if (d.success === false) m.failedToolCalls++;
      const content = typeof d.result?.content === 'string' ? d.result.content : '';
      const tokens = estimateTokens(content.length);
      // Copilot CLI exposes different tool families per session: view/grep/glob or read_file/grep_search/file_search.
      const target = s.args.path ?? s.args.file_path ?? s.args.filePath;
      const command = String(s.args.command ?? '');
      if (/tools[\\/]read\.mjs/.test(command) && d.success !== false) {
        // v6 multi-target reader: one shell call returns several files; split by its "### path" headers.
        m.multiReadCalls = (m.multiReadCalls ?? 0) + 1;
        for (const part of content.split(/^### /m).slice(1)) {
          const rel = part.split(/[\s(]/)[0];
          if (rel && path.extname(rel)) reads.set(rel, (reads.get(rel) ?? 0) + estimateTokens(part.length));
        }
      } else if (READ_TOOLS.has(s.name) && target && d.success !== false && path.extname(target)) {
        const rel = toRelative(target, armDir);
        reads.set(rel, (reads.get(rel) ?? 0) + tokens);
      } else {
        m.otherToolTokens += tokens;
      }
    } else if (e.type === 'assistant.message' && d.content && !(d.toolRequests?.length)) {
      m.answer = d.content;
    } else if (e.type === 'result') {
      m.exitCode = e.exitCode ?? null;
    }
  }

  m.toolset = Object.keys(m.toolCallsByName).some((n) => READ_TOOLS.has(n) && n !== 'view') ? 'read_file' : 'view';
  for (const [rel, tokens] of reads) {
    const kind = classify(rel);
    m.filesRead.push({ path: rel, kind, tokens });
    if (kind === 'doc') { m.docFilesRead++; m.docTokensRead += tokens; }
    else if (kind === 'code') { m.codeFilesRead++; m.codeTokensRead += tokens; }
    else m.otherToolTokens += tokens;
  }
  m.filesRead.sort((a, b) => b.tokens - a.tokens);
  return m;
}

/** Score an answer against keyword groups: each group passes if any alternative appears. */
export function grade(answer, expect) {
  const text = (answer ?? '').toLowerCase();
  const results = expect.map((group) => ({
    group,
    pass: group.some((alt) => text.includes(alt.toLowerCase())),
  }));
  const passed = results.filter((r) => r.pass).length;
  return { score: expect.length ? passed / expect.length : 0, passed, total: expect.length, missing: results.filter((r) => !r.pass).map((r) => r.group[0]) };
}

export const median = (xs) => {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return NaN;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
};

/**
 * Claude Code (`claude -p --output-format stream-json --verbose`) → the same metrics shape as parseRun.
 * Token totals come from the final `result` event (modelUsage); tool calls and results from message content blocks.
 * Input tokens include cache reads and cache writes, matching Copilot's inputTokens.
 */
export function parseClaudeRun({ eventsFile, armDir }) {
  const m = {
    agent: 'claude',
    inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, reasoningTokens: 0,
    modelRequests: 0, premiumRequests: 0, aiCredits: 0, costUsd: 0, apiDurationMs: 0,
    mainInputTokens: 0, mainRequests: 0, subagentInputTokens: 0, subagentRuns: 0, models: [],
    toolCalls: 0, toolCallsByName: {}, failedToolCalls: 0, toolset: 'claude', multiReadCalls: 0,
    filesRead: [], docFilesRead: 0, codeFilesRead: 0,
    docTokensRead: 0, codeTokensRead: 0, otherToolTokens: 0,
    filesModified: [], answer: '', exitCode: null,
  };
  if (!existsSync(eventsFile)) return m;
  const calls = new Map();
  const reads = new Map();
  const mainIds = new Set();
  const subIds = new Set();
  const textOf = (c) => (typeof c === 'string' ? c : Array.isArray(c) ? c.map((x) => x.text ?? '').join('\n') : '');
  for (const line of readFileSync(eventsFile, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (e.type === 'assistant' && e.message) {
      (e.parent_tool_use_id ? subIds : mainIds).add(e.message.id);
      for (const b of e.message.content ?? []) {
        if (b.type !== 'tool_use') continue;
        calls.set(b.id, { name: b.name, input: b.input ?? {} });
        m.toolCalls++;
        m.toolCallsByName[b.name] = (m.toolCallsByName[b.name] ?? 0) + 1;
        if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(b.name) && b.input?.file_path) m.filesModified.push(b.input.file_path);
      }
    } else if (e.type === 'user' && e.message) {
      for (const b of e.message.content ?? []) {
        if (b.type !== 'tool_result') continue;
        const call = calls.get(b.tool_use_id) ?? { name: '?', input: {} };
        if (b.is_error) { m.failedToolCalls++; continue; }
        const content = textOf(b.content);
        const command = String(call.input.command ?? '');
        if (/tools[\/]read\.mjs/.test(command)) {
          m.multiReadCalls++;
          for (const part of content.split(/^### /m).slice(1)) {
            const rel = part.split(/[\s(]/)[0];
            if (rel && path.extname(rel)) reads.set(rel, (reads.get(rel) ?? 0) + estimateTokens(part.length));
          }
        } else if (call.name === 'Read' && call.input.file_path && path.extname(call.input.file_path)) {
          const rel = toRelative(call.input.file_path, armDir);
          reads.set(rel, (reads.get(rel) ?? 0) + estimateTokens(content.length));
        } else {
          m.otherToolTokens += estimateTokens(content.length);
        }
      }
    } else if (e.type === 'result') {
      m.exitCode = e.is_error ? 1 : 0;
      m.answer = e.result ?? '';
      m.costUsd = e.total_cost_usd ?? 0;
      m.apiDurationMs = e.duration_api_ms ?? 0;
      for (const [model, u] of Object.entries(e.modelUsage ?? {})) {
        m.models.push(model);
        const input = (u.inputTokens ?? 0) + (u.cacheReadInputTokens ?? 0) + (u.cacheCreationInputTokens ?? 0);
        m.inputTokens += input;
        m.outputTokens += u.outputTokens ?? 0;
        m.cacheReadTokens += u.cacheReadInputTokens ?? 0;
        m.cacheWriteTokens += u.cacheCreationInputTokens ?? 0;
      }
      m.reasoningTokens = e.usage?.output_tokens_details?.thinking_tokens ?? 0;
    }
  }
  // One API request per assistant message id. Subagents (if any were enabled) are counted separately.
  m.mainRequests = mainIds.size;
  m.subagentRuns = subIds.size ? 1 : 0;
  m.modelRequests = mainIds.size + subIds.size;
  m.mainInputTokens = m.inputTokens; // modelUsage doesn't split main vs subagent; subagents are disabled by default
  for (const [rel, tokens] of reads) {
    const kind = classify(rel);
    m.filesRead.push({ path: rel, kind, tokens });
    if (kind === 'doc') { m.docFilesRead++; m.docTokensRead += tokens; }
    else if (kind === 'code') { m.codeFilesRead++; m.codeTokensRead += tokens; }
    else m.otherToolTokens += tokens;
  }
  m.filesRead.sort((a, b) => b.tokens - a.tokens);
  return m;
}
