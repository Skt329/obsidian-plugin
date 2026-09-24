// The single adapter between this plugin and the official Obsidian CLI (verified on 1.13.7).
//
// The CLI has quirks every caller must survive, so they are handled here once:
//   - It exits 0 on failure and prints "Error: ..." on stdout.
//   - Empty results are sentences ("No matches found.") even when JSON was requested.
//   - Only some verbs honour format=; the rest silently ignore it and print text.
//   - An unknown vault= name silently falls back to whichever vault is active.
//   - daily:read CREATES today's note as a side effect.
//   - Some outputs start with a blank line.
// Spawned without a shell, so note content can never be interpreted as shell syntax.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readConfig, appendActivity } from './config.mjs';

const BIN = process.env.OBSIDIAN_CLI || 'obsidian';
const TIMEOUT_MS = 20_000;
// Windows caps a whole command line near 32K characters; stay well under it.
export const MAX_CONTENT_CHARS = 24_000;

// Verbs whose help lists format= (obsidian --help, 1.13.7). Every other verb ignores it.
export const JSON_VERBS = new Set([
  'backlinks', 'base:query', 'bookmarks', 'hotkeys', 'outline', 'plugins', 'plugins:enabled',
  'properties', 'search', 'search:context', 'tags', 'tasks', 'unresolved',
]);

// Verbs that write to the vault, or create a file as a side effect.
export const MUTATING_VERBS = new Set([
  'create', 'append', 'prepend', 'move', 'rename', 'delete', 'unique', 'property:set',
  'property:remove', 'template:insert', 'base:create', 'history:restore', 'sync:restore',
  'daily', 'daily:read', 'daily:append', 'daily:prepend',
]);

// Every daily:* verb except daily:path materialises today's note if it does not exist.
export const DAILY_CREATING_VERBS = new Set(['daily', 'daily:read', 'daily:append', 'daily:prepend']);

const TASK_MUTATING_FLAGS = new Set(['done', 'todo', 'toggle']);

export function isMutating(args) {
  const [verb, ...rest] = args;
  if (MUTATING_VERBS.has(verb)) return true;
  return verb === 'task' && rest.some((a) => TASK_MUTATING_FLAGS.has(a) || a.startsWith('status='));
}

export function classifyOutput(raw) {
  const text = String(raw ?? '').replace(/\r\n/g, '\n').replace(/^(?:[ \t]*\n)+/, '').trimEnd();
  const first = (text.split('\n')[0] ?? '').trim();
  if (/^Error:/.test(first)) return { kind: 'error', text, message: first };
  if (/^No [^\n]+ found\.?$/.test(first) && !text.includes('\n')) return { kind: 'empty', text: '' };
  return { kind: 'ok', text };
}

export function normalizeFsPath(p) {
  if (!p) return '';
  let s = String(p).trim().replace(/^["']|["']$/g, '');
  // Git Bash /c/Users/... form -> C:\Users\...
  if (process.platform === 'win32') {
    const msys = s.match(/^\/([a-zA-Z])(\/.*)?$/);
    if (msys) s = `${msys[1]}:${msys[2] ?? '/'}`;
  }
  s = path.resolve(s);
  if (process.platform === 'win32') s = s.replace(/\//g, '\\').toLowerCase();
  return s.replace(/[\\/]+$/, '');
}

// The CLI reads \n and \t inside content= as escapes, so real newlines are encoded to match.
export function encodeContent(text) {
  return String(text).replace(/\r\n/g, '\n').replace(/\t/g, '\\t').replace(/\n/g, '\\n');
}

export function prepareArgs(args, config, { json = false } = {}) {
  const out = [];
  for (const arg of args) {
    if (arg.startsWith('content-file=')) {
      const file = arg.slice('content-file='.length);
      const text = readFileSync(file, 'utf8');
      if (text.length > MAX_CONTENT_CHARS) {
        throw new Error(
          `Content is ${text.length} characters, beyond what a command line can carry (${MAX_CONTENT_CHARS}). ` +
            `Write the note directly with the Write tool at a path inside the vault instead.`
        );
      }
      out.push(`content=${encodeContent(text)}`);
    } else {
      out.push(arg);
    }
  }
  if (!out.some((a) => a.startsWith('vault=')) && config?.vaultName) out.push(`vault=${config.vaultName}`);
  if (json && JSON_VERBS.has(out[0]) && !out.some((a) => a.startsWith('format='))) out.push('format=json');
  return out;
}

export function targetOf(args) {
  for (const key of ['path=', 'file=', 'name=']) {
    const hit = args.find((a) => a.startsWith(key));
    if (hit) return hit.slice(key.length);
  }
  return null;
}

function spawnCli(args) {
  const result = spawnSync(BIN, args, { encoding: 'utf8', timeout: TIMEOUT_MS, shell: false });
  const timedOut = result.error?.code === 'ETIMEDOUT' || result.signal === 'SIGTERM';
  const notFound = result.error?.code === 'ENOENT';
  const out = classifyOutput(result.stdout);
  const ok = result.status === 0 && !result.error && out.kind !== 'error';
  return {
    ok,
    empty: out.kind === 'empty',
    status: result.status,
    stdout: out.kind === 'error' ? '' : out.text,
    stderr: [out.kind === 'error' ? out.message : '', (result.stderr ?? '').trim()].filter(Boolean).join('\n'),
    error: result.error,
    timedOut,
    hint: timedOut
      ? 'The Obsidian CLI did not respond in time. It drives the running Obsidian app, which blocks while starting up or checking for updates. Make sure Obsidian is open and idle, then retry.'
      : notFound
        ? 'The "obsidian" command was not found. Install Obsidian 1.12.7 or later and enable Settings > General > Command line interface.'
        : null,
  };
}

// `vault` prints a key<TAB>value table: name, path, files, folders, size.
export function parseVaultInfo(text) {
  const info = {};
  for (const line of String(text ?? '').split('\n')) {
    const tab = line.indexOf('\t');
    if (tab > 0) info[line.slice(0, tab).trim()] = line.slice(tab + 1).trim();
  }
  return info;
}

const verified = new Set();
const refuse = (stderr) => ({ ok: false, stdout: '', stderr });

// An unknown vault= name silently falls back to the active vault, so before the first write to a
// vault in this process, round-trip the name: the CLI must report back the vault we asked for.
function verifyVault(args, config) {
  const name = (args.find((a) => a.startsWith('vault=')) ?? '').slice('vault='.length);
  if (!name) return refuse('Refusing to write: no vault is configured and none was named. Run vault-setup first.');
  if (verified.has(name)) return null;

  const res = spawnCli(['vault', `vault=${name}`]);
  if (!res.ok) return res;
  const info = parseVaultInfo(res.stdout);
  if (info.name !== name) {
    return refuse(
      `Refusing to write: Obsidian has no vault named "${name}" — the CLI fell back to "${info.name ?? 'the active vault'}". ` +
        'The vault may have been renamed or removed. Re-run vault-setup to update the config.'
    );
  }
  if (config?.vaultName === name && config.vaultPath && normalizeFsPath(info.path) !== normalizeFsPath(config.vaultPath)) {
    return refuse(
      `Refusing to write: vault "${name}" is at "${info.path}", not the configured "${config.vaultPath}". ` +
        'It may have been moved. Re-run vault-setup to update the config.'
    );
  }
  verified.add(name);
  return null;
}

export function runObsidian(args, { json = false } = {}) {
  const config = readConfig();
  const verb = args[0];

  if (DAILY_CREATING_VERBS.has(verb) && config?.profile?.dailyNotes !== 'used') {
    return {
      ok: false,
      stdout: '',
      stderr: `Refusing "${verb}": it creates today's daily note if it does not exist, and this vault is not recorded as using daily notes (profile.dailyNotes is "${config?.profile?.dailyNotes ?? 'unset'}"). Put dated content where the vault's own conventions say, or set profile.dailyNotes to "used" via vault-setup.`,
    };
  }

  let prepared;
  try {
    prepared = prepareArgs(args, config, { json });
  } catch (err) {
    return { ok: false, stdout: '', stderr: err.message };
  }

  const mutating = isMutating(args);
  if (mutating) {
    const refusal = verifyVault(prepared, config);
    if (refusal) return refusal;
  }

  const res = spawnCli(prepared);
  if (res.ok && mutating) {
    appendActivity({
      kind: 'vault',
      verb,
      vault: config?.vaultName ?? null,
      target: targetOf(prepared),
      sessionId: process.env.CLAUDE_CODE_SESSION_ID || process.env.CLAUDE_SESSION_ID || null,
    });
  }
  return res;
}

export function runObsidianJson(args) {
  if (!JSON_VERBS.has(args[0])) {
    return { ok: false, data: null, stdout: '', stderr: `"${args[0]}" does not support format=json; parse its text output instead.` };
  }
  const res = runObsidian(args, { json: true });
  if (!res.ok) return { ...res, data: null };
  if (res.empty) return { ...res, data: [] };
  try {
    return { ...res, data: JSON.parse(res.stdout) };
  } catch {
    return { ...res, ok: false, data: null, stderr: `Could not parse JSON from "${args[0]}".` };
  }
}

// CLI entry: node obsidian-cli.mjs <command> [key=value ...]
// content-file=<path> reads note content from a file, so callers never paste content into a shell string.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node obsidian-cli.mjs <command> [key=value ...]');
    process.exitCode = 1;
  } else {
    const res = runObsidian(args);
    if (res.stdout) console.log(res.stdout);
    if (res.stderr) console.error(res.stderr);
    if (res.hint) console.error(`[obsidian-vault-copilot] ${res.hint}`);
    process.exitCode = res.ok ? 0 : 1;
  }
}
