// SessionStart hook. Runs in every Claude Code session on the machine, so it is silent unless
// something is genuinely wrong with the configured vault. It never launches Obsidian: the CLI
// auto-starts the app when called, so the probe checks for a running Obsidian first.
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { loadConfig } from './config.mjs';
import { runObsidian, normalizeFsPath } from './obsidian-cli.mjs';

const TAG = '[obsidian-vault-copilot]';

// `vaults verbose` prints name<TAB>path per line, sometimes after a blank line.
// `vaults` ignores format=json, so this is the only structured form available.
export function parseVaultList(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const tab = l.indexOf('\t');
      return tab === -1 ? { name: l, path: null } : { name: l.slice(0, tab).trim(), path: l.slice(tab + 1).trim() };
    });
}

export function diagnose(config, vaults) {
  const hit = vaults.find((v) => v.name === config.vaultName);
  if (!hit) {
    return `${TAG} Vault "${config.vaultName}" is not in Obsidian's vault list — was it renamed or removed? Re-run vault-setup to update the config.`;
  }
  if (hit.path && normalizeFsPath(hit.path) !== normalizeFsPath(config.vaultPath)) {
    return `${TAG} Vault "${config.vaultName}" is at "${hit.path}" in Obsidian but "${config.vaultPath}" in the config. Re-run vault-setup to update it.`;
  }
  return null;
}

function obsidianRunning() {
  const probe =
    process.platform === 'win32'
      ? spawnSync('tasklist', ['/FI', 'IMAGENAME eq Obsidian.exe', '/NH'], { encoding: 'utf8', timeout: 5000 })
      : spawnSync('pgrep', ['-if', 'obsidian'], { encoding: 'utf8', timeout: 5000 });
  if (probe.error) return null; // cannot tell — caller stays quiet rather than risk launching the app
  return process.platform === 'win32' ? /obsidian\.exe/i.test(probe.stdout ?? '') : probe.status === 0;
}

function main() {
  const { status, config, error } = loadConfig();
  if (status === 'missing') return; // not set up yet: the skills say so when asked, no need to nag every project
  if (status === 'invalid') {
    console.log(`${TAG} Config at the plugin's config path could not be parsed (${error}). Fix it or re-run vault-setup — skills will not guess.`);
    return;
  }
  if (!config?.vaultName) return;
  if (obsidianRunning() !== true) return; // closed or unknown: skills open it on demand

  const res = runObsidian(['vaults', 'verbose']);
  if (res.timedOut) {
    console.log(`${TAG} Obsidian is running but did not answer (it may be starting up or updating). Vault skills may be slow until it is idle.`);
    return;
  }
  if (!res.ok) return;
  const message = diagnose(config, parseVaultList(res.stdout));
  if (message) console.log(message);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch {
    // an informational hook must never break session start
  }
  process.exitCode = 0;
}
