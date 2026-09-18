// Shared config store for obsidian-vault-copilot.
// Per-user state lives OUTSIDE the plugin repo entirely, so it can never be
// accidentally committed and the same plugin works unmodified for everyone who
// installs it. Nothing here is specific to any vault, person or workflow.
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
    throw new Error('No vault configured yet. Run the vault-setup skill first.');
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

// Supports dot paths so skills can ask for one nested value, e.g. profile.folders.daily
function pluck(obj, dotPath) {
  return dotPath.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function summary(config) {
  const p = config.profile ?? {};
  const lines = [
    `vault:      ${config.vaultName} (${config.vaultPath})`,
    `setup mode: ${config.setupMode ?? 'unknown'}`,
    `use cases:  ${(config.useCases ?? []).join(', ') || '(none recorded)'}`,
    `audience:   ${config.audienceName || config.audienceLabel || '(none)'}`,
    `sync:       ${config.syncMode ?? 'none'}`,
    `folders:    ${JSON.stringify(p.folders ?? {})}`,
    `naming:     ${p.namingStyle ?? '(follow existing notes)'}`,
    `daily note: ${p.dailyNoteFormat ?? '(discover via daily:path)'}`,
    `projects:   ${(config.projectRepos ?? []).length} configured`,
    `shared repo:${config.sharedRepoPath ? ' ' + config.sharedRepoPath : ' (none)'}`,
  ];
  return lines.join('\n');
}

// CLI entry: `node config.mjs get [dot.path]` / `node config.mjs summary`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , cmd, key] = process.argv;
  const config = readConfig();
  if (cmd === 'get') {
    if (!config) {
      console.log('NOT_CONFIGURED');
    } else if (key) {
      const value = pluck(config, key);
      console.log(value === undefined || value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : value);
    } else {
      console.log(JSON.stringify(config, null, 2));
    }
  } else if (cmd === 'summary') {
    console.log(config ? summary(config) : 'NOT_CONFIGURED');
  } else {
    console.error('Usage: node config.mjs get [dot.path] | node config.mjs summary');
    process.exitCode = 1;
  }
}
