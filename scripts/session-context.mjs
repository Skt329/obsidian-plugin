// Harvests real context about the work happening right now, so notes written into
// the vault are grounded in what actually happened rather than in what someone can
// remember to retype.
//
// Every source here is OPTIONAL. A user with no git repository, no transcript and a
// brand-new vault is normal — the harvest degrades to whatever exists and never
// throws. Callers should treat missing sections as "unknown", not as failure.
import { existsSync, readdirSync, readFileSync, openSync, readSync, fstatSync, closeSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const MAX_TRANSCRIPT_BYTES = 8 * 1024 * 1024;

function git(args, cwd) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8', timeout: 15_000, shell: false });
  return { ok: res.status === 0 && !res.error, stdout: (res.stdout ?? '').trim() };
}

// Claude Code stores transcripts under a directory named after the project path with
// separators, colons, spaces and dots flattened to dashes. Verified against real dirs
// (e.g. C:\Users\X\Projects\my.app -> C--Users-X-Projects-my-app). This is an
// implementation detail of the host tool, so every consumer must tolerate a miss.
export function projectSlug(projectDir) {
  return path.resolve(projectDir).replace(/[:\\/ .]/g, '-');
}

function readTail(file) {
  const fd = openSync(file, 'r');
  try {
    const { size } = fstatSync(fd);
    const length = Math.min(size, MAX_TRANSCRIPT_BYTES);
    const buf = Buffer.alloc(length);
    readSync(fd, buf, 0, length, size - length);
    return buf.toString('utf8');
  } finally {
    closeSync(fd);
  }
}

function stripNoise(text) {
  return text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/<local-command-[\s\S]*?>[\s\S]*?<\/local-command-[^>]*>/g, '')
    .replace(/<command-(name|message|args)>[\s\S]*?<\/command-\1>/g, '')
    .trim();
}

function findTranscript(projectDir) {
  const dir = path.join(homedir(), '.claude', 'projects', projectSlug(projectDir));
  if (!existsSync(dir)) return { dir: null, file: null, guessed: false };
  // Claude Code exposes CLAUDE_CODE_SESSION_ID; the older name is kept as a fallback.
  const sessionId = process.env.CLAUDE_CODE_SESSION_ID || process.env.CLAUDE_SESSION_ID;
  const wanted = sessionId ? `${sessionId}.jsonl` : null;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => path.join(dir, f));
  if (!files.length) return { dir, file: null, guessed: false };
  if (wanted) {
    const exact = files.find((f) => path.basename(f) === wanted);
    if (exact) return { dir, file: exact, guessed: false };
  }
  // No session id match: the newest transcript is a guess and may belong to another session.
  const newest = files
    .map((f) => ({ f, t: safeMtime(f) }))
    .sort((a, b) => b.t - a.t)[0];
  return { dir, file: newest?.f ?? null, guessed: Boolean(newest) };
}

function safeMtime(file) {
  try {
    const fd = openSync(file, 'r');
    try {
      return fstatSync(fd).mtimeMs;
    } finally {
      closeSync(fd);
    }
  } catch {
    return 0;
  }
}

function parseTranscript(file, { promptLimit = 12, fileLimit = 40 } = {}) {
  const out = { available: false, prompts: [], filesTouched: [], sessionId: null, cwd: null, gitBranch: null };
  if (!file || !existsSync(file)) return out;

  let raw;
  try {
    raw = readTail(file);
  } catch {
    return out;
  }

  const lines = raw.split('\n');
  // A tail read can slice the first line mid-JSON; dropping it is cheaper than guessing.
  lines.shift();

  const touched = new Map();
  for (const line of lines) {
    if (!line.trim()) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }

    if (rec.type === 'user' && rec.message?.role === 'user' && typeof rec.message.content === 'string') {
      const text = stripNoise(rec.message.content);
      if (text) {
        out.prompts.push({ at: rec.timestamp ?? null, text: text.slice(0, 600) });
        out.sessionId = rec.sessionId ?? out.sessionId;
        out.cwd = rec.cwd ?? out.cwd;
        out.gitBranch = rec.gitBranch ?? out.gitBranch;
      }
    } else if (rec.type === 'file-history-delta' && rec.trackingPath) {
      touched.set(rec.trackingPath, rec.timestamp ?? null);
    }
  }

  out.available = true;
  out.prompts = out.prompts.slice(-promptLimit);
  out.filesTouched = [...touched.entries()].slice(-fileLimit).map(([file, at]) => ({ file, at }));
  return out;
}

function gitContext(projectDir) {
  const inside = git(['rev-parse', '--is-inside-work-tree'], projectDir);
  if (!inside.ok || inside.stdout !== 'true') return { isRepo: false };
  const status = git(['status', '--porcelain'], projectDir);
  return {
    isRepo: true,
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD'], projectDir).stdout || null,
    changedFiles: status.stdout ? status.stdout.split('\n').filter(Boolean).slice(0, 40) : [],
    recentCommits: git(['log', '--oneline', '-15'], projectDir).stdout.split('\n').filter(Boolean),
    diffStat: git(['diff', '--stat'], projectDir).stdout || null,
  };
}

function instructionFiles(projectDir) {
  const candidates = ['CLAUDE.md', path.join('.claude', 'CLAUDE.md'), 'AGENTS.md', 'README.md'];
  return candidates
    .map((rel) => ({ rel, abs: path.join(projectDir, rel) }))
    .filter((c) => existsSync(c.abs))
    .map((c) => c.rel);
}

function memoryIndex(projectDir) {
  const file = path.join(homedir(), '.claude', 'projects', projectSlug(projectDir), 'memory', 'MEMORY.md');
  if (!existsSync(file)) return null;
  try {
    return { file, content: readFileSync(file, 'utf8').slice(0, 4000) };
  } catch {
    return null;
  }
}

export function harvest(projectDir = process.cwd()) {
  const resolved = path.resolve(projectDir);
  const { dir, file, guessed } = findTranscript(resolved);
  return {
    projectDir: resolved,
    harvestedAt: new Date().toISOString(),
    session: parseTranscript(file),
    transcriptDir: dir,
    transcriptFile: file,
    transcriptGuessed: guessed,
    git: gitContext(resolved),
    instructionFiles: instructionFiles(resolved),
    memory: memoryIndex(resolved),
    notes: [
      'Every section is best-effort. An absent section means "not available here", not "nothing happened".',
      'Transcript layout is a host-tool implementation detail and may change without warning.',
      'Verify specifics (names, numbers, dates) against the repository before writing them into a note as fact.',
    ],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , cmd, dirArg] = process.argv;
  if (cmd && cmd !== 'harvest') {
    console.error('Usage: node session-context.mjs harvest [projectDir]');
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(harvest(dirArg || process.cwd()), null, 2));
  }
}
