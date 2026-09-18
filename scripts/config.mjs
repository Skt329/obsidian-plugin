// Shared config store for obsidian-vault-copilot.
// Authoritative per-user state lives OUTSIDE the plugin repo entirely, so it can
// never be accidentally committed and the same plugin works unmodified for every
// teammate who installs it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const CONFIG_DIR = path.join(homedir(), '.claude', 'obsidian-vault-copilot');
export const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
export const ACTIVITY_LOG_PATH = path.join(CONFIG_DIR, 'activity.log');

export function readConfig() {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return null;
  }
}

export function requireConfig() {
  const config = readConfig();
  if (!config || !config.vaultName || !config.vaultPath) {
    throw new Error('No vault configured yet. Run /vault-setup first.');
  }
  return config;
}

export function writeConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

export function appendActivity(line) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(ACTIVITY_LOG_PATH, `${stamp}\t${line}\n`, { flag: 'a' });
}

// CLI entry: `node config.mjs get [key]` — used by SKILL.md `!` context snippets.
// Compared via pathToFileURL (not a manual `file://` string) since process.argv[1]
// may be relative and isn't URL-encoded — a naive comparison never matches on Windows.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , cmd, key] = process.argv;
  if (cmd === 'get') {
    const config = readConfig();
    if (!config) {
      console.log('NOT_CONFIGURED');
    } else if (key) {
      console.log(config[key] ?? '');
    } else {
      console.log(JSON.stringify(config, null, 2));
    }
  } else {
    console.error('Usage: node config.mjs get [key]');
    process.exitCode = 1;
  }
}
