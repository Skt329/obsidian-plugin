// Read-only git helpers for vault-sync, standup/report and the SessionEnd hook.
// Spawned without a shell for the same injection-safety reason as obsidian-cli.mjs.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadConfig, readActivity } from './config.mjs';

function git(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', timeout: 20_000, shell: false });
  return {
    ok: result.status === 0 && !result.error,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  };
}

export function statusPorcelain(cwd) {
  return git(['status', '--porcelain'], cwd);
}

export function diffStat(cwd) {
  return git(['diff', '--stat'], cwd);
}

export function parseRemotes(text) {
  const seen = new Map();
  for (const line of String(text ?? '').split('\n').filter(Boolean)) {
    const [name, rest] = line.split('\t');
    const url = rest?.split(' ')[0];
    if (name && url) seen.set(name, url);
  }
  return [...seen.entries()].map(([name, url]) => ({ name, url }));
}

export function listRemotes(cwd) {
  const res = git(['remote', '-v'], cwd);
  return res.ok ? parseRemotes(res.stdout) : [];
}

// Vault changes the plugin itself made, from the wrapper's JSONL log — scoped to one vault.
export function recentActivity(vaultName, limit = 30) {
  return readActivity({ vault: vaultName, limit }).map((r) => `${r.ts}  ${r.verb}  ${r.target ?? ''}`.trimEnd());
}

function sessionEndCheck() {
  const { config } = loadConfig();
  if (!config?.vaultPath || !existsSync(config.vaultPath)) return;
  // git is one sync option among several; never nag someone who chose another.
  if (config.syncMode !== 'git') return;
  const status = statusPorcelain(config.vaultPath);
  if (!status.ok) return;
  const changed = status.stdout.split('\n').filter(Boolean).length;
  if (changed > 0) {
    console.log(`[obsidian-vault-copilot] ${changed} file(s) changed in your vault — run vault-sync to review and commit.`);
  }
}

function report(res, emptyText) {
  if (!res.ok) {
    console.error(res.stderr || 'git command failed');
    process.exitCode = 1;
  } else {
    console.log(res.stdout || emptyText);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , cmd, arg] = process.argv;
  const { config } = loadConfig();
  const cwd = arg || config?.vaultPath;
  switch (cmd) {
    case 'session-end-check':
      sessionEndCheck();
      break;
    case 'status':
      report(statusPorcelain(cwd), '(clean)');
      break;
    case 'diff-stat':
      report(diffStat(cwd), '(no changes)');
      break;
    case 'remotes':
      console.log(JSON.stringify(listRemotes(cwd)));
      break;
    case 'recent-activity': {
      const lines = recentActivity(arg || config?.vaultName);
      console.log(lines.length ? lines.join('\n') : '(no vault changes recorded by the plugin yet)');
      break;
    }
    default:
      console.error('Usage: node git-helpers.mjs <session-end-check|status|diff-stat|remotes> [dir] | recent-activity [vaultName]');
      process.exitCode = 1;
  }
}
