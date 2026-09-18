// Read-only git helpers shared by vault-sync, vault-standup/report, and the
// SessionEnd hook. Spawned without a shell for the same injection-safety reason
// as obsidian-cli.mjs.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { readConfig, ACTIVITY_LOG_PATH } from './config.mjs';

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

export function listRemotes(cwd) {
  const res = git(['remote', '-v'], cwd);
  if (!res.ok) return [];
  const seen = new Map();
  for (const line of res.stdout.split('\n').filter(Boolean)) {
    const [name, rest] = line.split('\t');
    const url = rest?.split(' ')[0];
    if (name && url) seen.set(name, url);
  }
  return [...seen.entries()].map(([name, url]) => ({ name, url }));
}

export function recentActivityLines(limit = 20) {
  if (!existsSync(ACTIVITY_LOG_PATH)) return [];
  const lines = readFileSync(ACTIVITY_LOG_PATH, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit);
}

function sessionEndCheck() {
  const config = readConfig();
  if (!config?.vaultPath || !existsSync(config.vaultPath)) return;
  const status = statusPorcelain(config.vaultPath);
  if (!status.ok) return;
  const changed = status.stdout.split('\n').filter(Boolean).length;
  if (changed > 0) {
    console.log(
      `[obsidian-vault-copilot] ${changed} file(s) changed in your vault this session — run /vault-sync to review and commit.`
    );
  }
}

// CLI entry
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , cmd, cwdArg] = process.argv;
  const config = readConfig();
  const cwd = cwdArg || config?.vaultPath;
  switch (cmd) {
    case 'session-end-check':
      sessionEndCheck();
      break;
    case 'status': {
      const res = statusPorcelain(cwd);
      if (!res.ok) {
        console.error(res.stderr || 'git status failed');
        process.exitCode = 1;
      } else {
        console.log(res.stdout || '(clean)');
      }
      break;
    }
    case 'diff-stat': {
      const res = diffStat(cwd);
      if (!res.ok) {
        console.error(res.stderr || 'git diff failed');
        process.exitCode = 1;
      } else {
        console.log(res.stdout || '(no changes)');
      }
      break;
    }
    case 'remotes':
      console.log(JSON.stringify(listRemotes(cwd)));
      break;
    case 'recent-activity':
      console.log(recentActivityLines().join('\n'));
      break;
    default:
      console.error('Usage: node git-helpers.mjs <session-end-check|status|diff-stat|remotes|recent-activity> [cwd]');
      process.exitCode = 1;
  }
}
