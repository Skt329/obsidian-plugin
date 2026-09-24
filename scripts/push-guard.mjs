// PreToolUse hook (Bash and PowerShell). Stops ACCIDENTAL pushes of the vault or shared repo
// that skipped the reviewed vault-sync / vault-share flow.
//
// Be honest about what this is: an accident-stopper, not a security boundary. The approval
// marker is text the assistant writes, so a determined or prompt-injected model could add it.
// The real boundary is Claude Code's permission prompt, which still asks before every push.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig } from './config.mjs';
import { normalizeFsPath } from './obsidian-cli.mjs';

const MARKER = /VAULT_COPILOT_CONFIRMED_PUSH\s*=\s*['"]?1\b/;
const CD_COMMANDS = new Set(['cd', 'pushd', 'set-location', 'sl', 'chdir']);
// git global options that consume the following token as their value
const GIT_VALUE_OPTS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--config-env']);

export function splitSegments(command) {
  const segments = [];
  let current = '';
  let quote = null;
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    const two = command.slice(i, i + 2);
    if (two === '&&' || two === '||') {
      segments.push(current);
      current = '';
      i++;
      continue;
    }
    if (ch === ';' || ch === '|' || ch === '\n') {
      segments.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  segments.push(current);
  return segments.map((s) => s.trim()).filter(Boolean);
}

export function tokenize(segment) {
  const tokens = [];
  let current = '';
  let quote = null;
  let started = false;
  for (const ch of segment) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (started) tokens.push(current);
      current = '';
      started = false;
      continue;
    }
    current += ch;
    started = true;
  }
  if (started) tokens.push(current);
  return tokens;
}

function resolveDir(base, target) {
  if (!target) return base;
  const msys = process.platform === 'win32' && target.match(/^\/([a-zA-Z])(\/.*)?$/);
  if (msys) return `${msys[1]}:${msys[2] ?? '/'}`;
  return path.resolve(base, target);
}

// Returns the directory a git push would act on, or null if the segment is not a push.
export function pushTarget(tokens, cwd) {
  let i = 0;
  while (i < tokens.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i]) || /^\$env:/i.test(tokens[i]))) i++;
  const bin = tokens[i];
  if (!bin || !/(^|[\\/])git(\.exe)?$/i.test(bin)) return null;
  i++;

  let dir = cwd;
  let workTree = null;
  let gitDir = null;
  while (i < tokens.length && tokens[i].startsWith('-')) {
    const tok = tokens[i];
    const [flag, inline] = tok.includes('=') ? [tok.slice(0, tok.indexOf('=')), tok.slice(tok.indexOf('=') + 1)] : [tok, null];
    const value = inline ?? (GIT_VALUE_OPTS.has(flag) ? tokens[++i] : null);
    if (flag === '-C') dir = resolveDir(dir, value);
    else if (flag === '--work-tree') workTree = resolveDir(dir, value);
    else if (flag === '--git-dir') gitDir = resolveDir(dir, value);
    i++;
  }
  if (tokens[i] !== 'push') return null;
  if (workTree) return workTree;
  if (gitDir) return path.dirname(gitDir);
  return dir;
}

function isInside(target, guarded) {
  const t = normalizeFsPath(target);
  const g = normalizeFsPath(guarded);
  return t === g || t.startsWith(g + path.sep) || t.startsWith(g + '/');
}

export function evaluatePush(payload, config) {
  const command = payload?.tool_input?.command;
  if (typeof command !== 'string' || !/\bgit\b/.test(command) || !/\bpush\b/.test(command)) return { block: false };
  const guarded = [config?.vaultPath, config?.sharedRepoPath].filter(Boolean);
  if (guarded.length === 0) return { block: false };
  if (MARKER.test(command)) return { block: false, reason: 'confirmed via the reviewed flow' };

  let cwd = payload?.cwd || process.cwd();
  for (const segment of splitSegments(command)) {
    const tokens = tokenize(segment);
    if (tokens.length && CD_COMMANDS.has(tokens[0].toLowerCase())) {
      const target = tokens.slice(1).find((t) => !/^\/d$/i.test(t) && !/^-/.test(t));
      cwd = resolveDir(cwd, target);
      continue;
    }
    const target = pushTarget(tokens, cwd);
    if (target && guarded.some((g) => isInside(target, g))) {
      return {
        block: true,
        reason:
          '[obsidian-vault-copilot] That push targets your vault or shared repo without going through review. ' +
          'Use vault-sync (or vault-share for the shared repo) so you see the diff and the remote before anything leaves this machine.',
      };
    }
  }
  return { block: false };
}

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let payload = null;
  try {
    payload = JSON.parse(await readStdin());
  } catch {
    process.exit(0);
  }
  const { config } = loadConfig();
  const verdict = evaluatePush(payload, config);
  if (verdict.block) {
    console.error(verdict.reason);
    process.exit(2);
  }
  process.exit(0);
}
