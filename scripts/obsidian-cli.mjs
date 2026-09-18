// Thin wrapper around the real `obsidian` CLI (Obsidian >= 1.12, confirmed v1.13.7).
// Always spawned WITHOUT a shell (args passed as an array of literal strings), so
// note content containing quotes/backticks/$ can never be interpreted as shell
// syntax — this is a deliberate command-injection guard, not an oversight.
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { readConfig } from './config.mjs';

export function runObsidian(args, { cwd } = {}) {
  const config = readConfig();
  const finalArgs = [...args];
  const hasVaultArg = finalArgs.some((a) => a.startsWith('vault='));
  if (!hasVaultArg && config?.vaultName) {
    // Every vault CLI call targets the configured vault explicitly — the user may
    // have more than one vault open, so "the active vault" is never assumed.
    finalArgs.push(`vault=${config.vaultName}`);
  }
  const result = spawnSync('obsidian', finalArgs, {
    encoding: 'utf8',
    timeout: 20_000,
    shell: false,
    cwd,
  });
  const timedOut = result.error?.code === 'ETIMEDOUT' || result.signal === 'SIGTERM';
  const notFound = result.error?.code === 'ENOENT';
  return {
    ok: result.status === 0 && !result.error,
    status: result.status,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
    error: result.error,
    timedOut,
    hint: timedOut
      ? 'The Obsidian CLI did not respond in time. It drives the running Obsidian app, which can block while starting up or checking for updates. Make sure Obsidian is open and idle, then retry.'
      : notFound
        ? 'The "obsidian" command was not found. Install Obsidian 1.12.7 or later and enable Settings > General > Command line interface.'
        : null,
  };
}

export function runObsidianJson(args, opts) {
  const withFormat = args.some((a) => a.startsWith('format=')) ? args : [...args, 'format=json'];
  const res = runObsidian(withFormat, opts);
  if (!res.ok) return { ...res, data: null };
  try {
    return { ...res, data: JSON.parse(res.stdout) };
  } catch {
    return { ...res, data: null };
  }
}

// CLI entry: `node obsidian-cli.mjs <command> [key=value ...]`
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
    else if (res.error) console.error(res.error.message);
    process.exitCode = res.ok ? 0 : 1;
  }
}
